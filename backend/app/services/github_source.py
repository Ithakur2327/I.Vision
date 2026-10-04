import httpx

GITHUB_API = "https://api.github.com"
RAW_BASE = "https://raw.githubusercontent.com"

TEXT_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".md", ".mdx", ".txt", ".json",
    ".yaml", ".yml", ".toml", ".go", ".rs", ".java", ".kt", ".c", ".h",
    ".cpp", ".hpp", ".cs", ".rb", ".php", ".html", ".css", ".scss", ".sql", ".sh",
}
ALWAYS_INCLUDE_NAMES = {"readme", "readme.md", "license", "dockerfile"}
SKIP_DIR_PARTS = {
    "node_modules", ".git", "dist", "build", ".next", "vendor",
    "venv", ".venv", "__pycache__", "coverage", ".turbo", "target",
}
MAX_FILES = 40
MAX_FILE_BYTES = 60_000
MAX_TOTAL_CHARS = 400_000


class GitHubFetchError(Exception):
    """Raised for any expected failure (bad URL, private/missing repo, rate limit, empty repo)."""


def parse_repo_url(url: str) -> tuple[str, str]:
    cleaned = url.strip()
    if "github.com" not in cleaned:
        raise GitHubFetchError("That doesn't look like a GitHub repository URL.")
    tail = cleaned.split("github.com", 1)[1].lstrip("/:").rstrip("/")
    parts = [p for p in tail.split("/") if p]
    if len(parts) < 2:
        raise GitHubFetchError("That doesn't look like a GitHub repository URL.")
    owner, repo = parts[0], parts[1]
    if repo.endswith(".git"):
        repo = repo[:-4]
    return owner, repo


def _is_text_candidate(path: str) -> bool:
    name = path.split("/")[-1]
    name_lower = name.lower()
    if name_lower in ALWAYS_INCLUDE_NAMES:
        return True
    if "." not in name:
        return False
    ext = "." + name.rsplit(".", 1)[-1].lower()
    return ext in TEXT_EXTENSIONS


def fetch_repo(url: str) -> dict:
    owner, repo = parse_repo_url(url)
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "ivision-app"}

    with httpx.Client(timeout=20.0, headers=headers) as client:
        meta_resp = client.get(f"{GITHUB_API}/repos/{owner}/{repo}")
        if meta_resp.status_code == 404:
            raise GitHubFetchError(f"Repository {owner}/{repo} wasn't found (private repos aren't supported yet).")
        if meta_resp.status_code == 403:
            raise GitHubFetchError("GitHub API rate limit reached — please try again in a few minutes.")
        if meta_resp.status_code != 200:
            raise GitHubFetchError(f"GitHub returned an unexpected error ({meta_resp.status_code}).")
        meta = meta_resp.json()
        branch = meta.get("default_branch") or "main"

        tree_resp = client.get(f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}", params={"recursive": "1"})
        if tree_resp.status_code != 200:
            raise GitHubFetchError("Couldn't read the repository's file tree.")
        tree = tree_resp.json().get("tree", [])

        candidates = []
        for entry in tree:
            if entry.get("type") != "blob":
                continue
            path = entry["path"]
            if any(part in SKIP_DIR_PARTS for part in path.split("/")):
                continue
            if not _is_text_candidate(path):
                continue
            if entry.get("size", 0) > MAX_FILE_BYTES:
                continue
            candidates.append(path)

        # README and top-level files first, then shallower paths, alphabetically
        candidates.sort(key=lambda p: (0 if "readme" in p.lower() else 1, p.count("/"), p))
        candidates = candidates[:MAX_FILES]

        files_text: list[str] = []
        total_chars = 0
        for path in candidates:
            if total_chars >= MAX_TOTAL_CHARS:
                break
            try:
                r = client.get(f"{RAW_BASE}/{owner}/{repo}/{branch}/{path}")
            except httpx.HTTPError:
                continue
            if r.status_code != 200 or not r.text.strip():
                continue
            snippet = r.text[: MAX_TOTAL_CHARS - total_chars]
            files_text.append(f"### File: {path}\n\n{snippet}")
            total_chars += len(snippet)

    if not files_text:
        raise GitHubFetchError(
            "Connected to the repo but found no readable text files to index "
            "(it may be empty, or made up of binary/generated files only)."
        )

    return {
        "title": f"{owner}/{repo}",
        "branch": branch,
        "description": meta.get("description") or "",
        "text": "\n\n---\n\n".join(files_text),
        "file_count": len(files_text),
    }