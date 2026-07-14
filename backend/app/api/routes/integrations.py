from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.models import GitHubRepository, YouTubeSource, WebsiteSource, LeetCodeProfile
from app.core.security import get_current_user_id

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


class UrlPayload(BaseModel):
    url: str


class UsernamePayload(BaseModel):
    username: str


NOT_CONFIGURED = (
    "This integration is architected but not activated. "
    "It requires an external API credential to be set on the backend "
    "before it can fetch and index real data."
)


@router.post("/github")
def add_github_repo(
    payload: UrlPayload,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    repo = GitHubRepository(owner_id=user_id, repo_url=payload.url, status="pending")
    db.add(repo)
    db.commit()
    db.refresh(repo)
    # NOTE: Real indexing requires a GitHub token (GITHUB_TOKEN env var) and
    # a background worker that clones/reads the repo tree, chunks files,
    # and pushes them through the same embeddings.embed_texts +
    # vectorstore.upsert_chunks pipeline used for documents.
    return {"id": repo.id, "status": repo.status, "note": NOT_CONFIGURED}


@router.post("/youtube")
def add_youtube_source(
    payload: UrlPayload,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    yt = YouTubeSource(owner_id=user_id, url=payload.url, status="pending")
    db.add(yt)
    db.commit()
    db.refresh(yt)
    # NOTE: Real indexing requires the youtube-transcript-api package
    # to fetch transcripts, then the same chunk + embed + upsert pipeline.
    return {"id": yt.id, "status": yt.status, "note": NOT_CONFIGURED}


@router.post("/website")
def add_website_source(
    payload: UrlPayload,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    site = WebsiteSource(owner_id=user_id, url=payload.url, status="pending")
    db.add(site)
    db.commit()
    db.refresh(site)
    # NOTE: Real indexing requires a fetch + readability-style content
    # extraction step, then the same chunk + embed + upsert pipeline.
    return {"id": site.id, "status": site.status, "note": NOT_CONFIGURED}


@router.post("/leetcode")
def add_leetcode_profile(
    payload: UsernamePayload,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = LeetCodeProfile(owner_id=user_id, username=payload.username, status="pending")
    db.add(profile)
    db.commit()
    db.refresh(profile)
    # NOTE: Real sync requires calling LeetCode's public GraphQL endpoint
    # for the given username and storing solved/unsolved problem stats.
    return {"id": profile.id, "status": profile.status, "note": NOT_CONFIGURED}
