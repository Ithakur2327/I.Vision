import httpx

LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

QUERY = """
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      ranking
      aboutMe
      countryName
    }
    submitStats {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
}
"""


class LeetCodeFetchError(Exception):
    """Raised for any expected failure (bad username, not found, API error)."""


def fetch_profile(username: str) -> dict:
    username = username.strip().lstrip("@")
    if "leetcode.com" in username:
        username = username.rstrip("/").split("/")[-1]
    if not username:
        raise LeetCodeFetchError("Please provide a LeetCode username.")

    headers = {
        "Content-Type": "application/json",
        "Referer": f"https://leetcode.com/{username}/",
        "User-Agent": "Mozilla/5.0 (compatible; ivision-bot/1.0)",
    }

    try:
        with httpx.Client(timeout=20.0, headers=headers) as client:
            resp = client.post(
                LEETCODE_GRAPHQL,
                json={"query": QUERY, "variables": {"username": username}},
            )
    except httpx.HTTPError as e:
        raise LeetCodeFetchError(f"Couldn't reach LeetCode ({e.__class__.__name__}).")

    if resp.status_code != 200:
        raise LeetCodeFetchError(f"LeetCode returned an unexpected error (HTTP {resp.status_code}).")

    payload = resp.json()
    if payload.get("errors"):
        raise LeetCodeFetchError(f"No public LeetCode profile found for '{username}'.")

    user = (payload.get("data") or {}).get("matchedUser")
    if not user:
        raise LeetCodeFetchError(f"No public LeetCode profile found for '{username}'.")

    profile = user.get("profile") or {}
    counts = {
        row["difficulty"]: row["count"]
        for row in (user.get("submitStats") or {}).get("acSubmissionNum", [])
    }

    solved_data = {
        "total": counts.get("All", 0),
        "easy": counts.get("Easy", 0),
        "medium": counts.get("Medium", 0),
        "hard": counts.get("Hard", 0),
        "ranking": profile.get("ranking"),
    }

    lines = [
        f"LeetCode profile: {username}",
        f"Real name: {profile.get('realName') or 'n/a'}",
        f"Ranking: {profile.get('ranking') or 'n/a'}",
        f"Country: {profile.get('countryName') or 'n/a'}",
        f"Problems solved — total: {solved_data['total']}, easy: {solved_data['easy']}, "
        f"medium: {solved_data['medium']}, hard: {solved_data['hard']}",
    ]
    if profile.get("aboutMe"):
        lines.append(f"About: {profile['aboutMe']}")

    return {"username": username, "solved_data": solved_data, "text": "\n".join(lines)}