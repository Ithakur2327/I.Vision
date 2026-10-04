import re

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
    InvalidVideoId,
    RequestBlocked,
    CouldNotRetrieveTranscript,
)

PREFERRED_LANGUAGES = ["en", "en-US", "en-GB", "en-IN", "hi"]
VIDEO_ID_PATTERNS = [
    r"(?:v=|/embed/|youtu\.be/|/shorts/)([A-Za-z0-9_-]{11})",
]


class YouTubeFetchError(Exception):
    """Raised for any expected failure (bad URL, no captions, blocked, unavailable)."""


def extract_video_id(url: str) -> str:
    url = url.strip()
    for pattern in VIDEO_ID_PATTERNS:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", url):
        return url  # a bare video ID was passed directly
    raise YouTubeFetchError("That doesn't look like a YouTube video URL.")


def fetch_transcript(url: str) -> dict:
    video_id = extract_video_id(url)
    api = YouTubeTranscriptApi()

    try:
        fetched = api.fetch(video_id, languages=PREFERRED_LANGUAGES)
    except NoTranscriptFound:
        # no transcript in our preferred languages — fall back to whatever
        # language IS available rather than failing outright
        try:
            transcript_list = api.list(video_id)
            fetched = next(iter(transcript_list)).fetch()
        except StopIteration:
            raise YouTubeFetchError("This video has no captions/transcript available.")
        except CouldNotRetrieveTranscript:
            raise YouTubeFetchError("This video has no captions/transcript available.")
    except TranscriptsDisabled:
        raise YouTubeFetchError("Captions are disabled for this video.")
    except VideoUnavailable:
        raise YouTubeFetchError("That video is unavailable (private, deleted, or region-locked).")
    except InvalidVideoId:
        raise YouTubeFetchError("That doesn't look like a valid YouTube video URL.")
    except RequestBlocked:
        raise YouTubeFetchError(
            "YouTube blocked this request (common for server/cloud IPs). "
            "This works reliably from most home/office connections; a hosted "
            "deployment may need a proxy — see the youtube-transcript-api docs."
        )
    except CouldNotRetrieveTranscript as e:
        raise YouTubeFetchError(f"Couldn't retrieve a transcript for that video ({e}).")

    text = " ".join(s.text.strip() for s in fetched if s.text and s.text.strip())
    if len(text) < 20:
        raise YouTubeFetchError("Found a transcript for that video, but it was empty.")

    return {"video_id": video_id, "language": fetched.language, "text": text}