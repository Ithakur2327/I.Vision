import httpx
from bs4 import BeautifulSoup

MAX_CHARS = 200_000
STRIP_TAGS = ["script", "style", "nav", "header", "footer", "aside", "form", "noscript", "svg", "iframe"]


class WebsiteFetchError(Exception):
    """Raised for any expected failure (bad URL, unreachable, non-HTML, empty)."""


def _normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"
    return url


def fetch_page(url: str) -> dict:
    url = _normalize_url(url)
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ivision-bot/1.0; +https://example.com/bot)"
    }

    try:
        with httpx.Client(timeout=20.0, headers=headers, follow_redirects=True) as client:
            resp = client.get(url)
    except httpx.HTTPError as e:
        raise WebsiteFetchError(f"Couldn't reach that URL ({e.__class__.__name__}).")

    if resp.status_code != 200:
        raise WebsiteFetchError(f"That page returned an error (HTTP {resp.status_code}).")

    content_type = resp.headers.get("content-type", "")
    if "text/html" not in content_type and "application/xhtml" not in content_type:
        raise WebsiteFetchError("That URL isn't an HTML page (can't extract readable text from it).")

    soup = BeautifulSoup(resp.text, "html.parser")

    title = soup.title.string.strip() if soup.title and soup.title.string else url

    for tag in soup(STRIP_TAGS):
        tag.decompose()

    # prefer <article> or <main> if present — usually the actual content,
    # skipping nav/sidebar/footer noise that a plain body dump would include
    container = soup.find("article") or soup.find("main") or soup.body or soup

    text = container.get_text(separator="\n", strip=True)
    # collapse runs of blank lines left behind by decompose()
    lines = [ln for ln in (l.strip() for l in text.split("\n")) if ln]
    text = "\n".join(lines)[:MAX_CHARS]

    if len(text) < 40:
        raise WebsiteFetchError("Connected, but found barely any readable text on that page.")

    return {"title": title, "url": url, "text": text}