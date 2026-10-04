from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.models import (
    GitHubRepository,
    YouTubeSource,
    WebsiteSource,
    LeetCodeProfile,
    KnowledgeSource,
)
from app.core.security import get_current_user_id
from app.services import vectorstore
from app.services.ingest import index_text
from app.services.github_source import fetch_repo, GitHubFetchError
from app.services.website_source import fetch_page, WebsiteFetchError
from app.services.youtube_source import fetch_transcript, YouTubeFetchError
from app.services.leetcode_source import fetch_profile, LeetCodeFetchError

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


class UrlPayload(BaseModel):
    url: str


class UsernamePayload(BaseModel):
    username: str


def _delete_row_and_source(db: Session, row) -> None:
    """Removes the tracking row and, if it was successfully indexed, its
    linked KnowledgeSource + vectors too. Mirrors knowledge.py's delete."""
    if row.source_id:
        source = db.query(KnowledgeSource).filter(KnowledgeSource.id == row.source_id).first()
        if source:
            vectorstore.delete_source(source.id)
            db.delete(source)
    db.delete(row)
    db.commit()


@router.get("/github")
def list_github_repos(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rows = db.query(GitHubRepository).filter(GitHubRepository.owner_id == user_id).all()
    return [
        {"id": r.id, "repo_url": r.repo_url, "status": r.status, "error": r.error}
        for r in rows
    ]


@router.get("/youtube")
def list_youtube_sources(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rows = db.query(YouTubeSource).filter(YouTubeSource.owner_id == user_id).all()
    return [
        {"id": r.id, "url": r.url, "title": r.title, "status": r.status, "error": r.error}
        for r in rows
    ]


@router.get("/website")
def list_website_sources(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rows = db.query(WebsiteSource).filter(WebsiteSource.owner_id == user_id).all()
    return [
        {"id": r.id, "url": r.url, "status": r.status, "error": r.error}
        for r in rows
    ]


@router.get("/leetcode")
def list_leetcode_profiles(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rows = db.query(LeetCodeProfile).filter(LeetCodeProfile.owner_id == user_id).all()
    return [
        {"id": r.id, "username": r.username, "status": r.status, "error": r.error}
        for r in rows
    ]


@router.delete("/github/{item_id}")
def delete_github_repo(
    item_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    row = db.query(GitHubRepository).filter(
        GitHubRepository.id == item_id, GitHubRepository.owner_id == user_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Repository not found")
    _delete_row_and_source(db, row)
    return {"status": "deleted", "id": item_id}


@router.delete("/youtube/{item_id}")
def delete_youtube_source(
    item_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    row = db.query(YouTubeSource).filter(
        YouTubeSource.id == item_id, YouTubeSource.owner_id == user_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Video not found")
    _delete_row_and_source(db, row)
    return {"status": "deleted", "id": item_id}


@router.delete("/website/{item_id}")
def delete_website_source(
    item_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    row = db.query(WebsiteSource).filter(
        WebsiteSource.id == item_id, WebsiteSource.owner_id == user_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Website not found")
    _delete_row_and_source(db, row)
    return {"status": "deleted", "id": item_id}


@router.delete("/leetcode/{item_id}")
def delete_leetcode_profile(
    item_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    row = db.query(LeetCodeProfile).filter(
        LeetCodeProfile.id == item_id, LeetCodeProfile.owner_id == user_id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    _delete_row_and_source(db, row)
    return {"status": "deleted", "id": item_id}


@router.post("/github")
def add_github_repo(
    payload: UrlPayload,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    row = GitHubRepository(owner_id=user_id, repo_url=payload.url, status="processing")
    db.add(row)
    db.flush()

    source = KnowledgeSource(owner_id=user_id, type="github", title=payload.url, status="processing")
    db.add(source)
    db.flush()
    row.source_id = source.id
    db.commit()

    try:
        result = fetch_repo(payload.url)
        source.title = result["title"]
        row.default_branch = result["branch"]
        index_text(db, source, result["text"])
        source.status = "ready"
        row.status = "ready"
        db.commit()
    except GitHubFetchError as e:
        source.status = "failed"
        row.status = "failed"
        row.error = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        source.status = "failed"
        row.status = "failed"
        row.error = "Unexpected error while indexing this repository."
        db.commit()
        raise HTTPException(status_code=500, detail=f"Indexing failed: {e}")

    return {"id": row.id, "repo_url": row.repo_url, "status": row.status, "error": row.error}


@router.post("/youtube")
def add_youtube_source(
    payload: UrlPayload,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    row = YouTubeSource(owner_id=user_id, url=payload.url, status="processing")
    db.add(row)
    db.flush()

    source = KnowledgeSource(owner_id=user_id, type="youtube", title=payload.url, status="processing")
    db.add(source)
    db.flush()
    row.source_id = source.id
    db.commit()

    try:
        result = fetch_transcript(payload.url)
        title = f"YouTube — {result['video_id']}"
        source.title = title
        row.title = title
        index_text(db, source, result["text"])
        source.status = "ready"
        row.status = "ready"
        db.commit()
    except YouTubeFetchError as e:
        source.status = "failed"
        row.status = "failed"
        row.error = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        source.status = "failed"
        row.status = "failed"
        row.error = "Unexpected error while indexing this video."
        db.commit()
        raise HTTPException(status_code=500, detail=f"Indexing failed: {e}")

    return {"id": row.id, "url": row.url, "title": row.title, "status": row.status, "error": row.error}


@router.post("/website")
def add_website_source(
    payload: UrlPayload,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    row = WebsiteSource(owner_id=user_id, url=payload.url, status="processing")
    db.add(row)
    db.flush()

    source = KnowledgeSource(owner_id=user_id, type="website", title=payload.url, status="processing")
    db.add(source)
    db.flush()
    row.source_id = source.id
    db.commit()

    try:
        result = fetch_page(payload.url)
        source.title = result["title"]
        index_text(db, source, result["text"])
        source.status = "ready"
        row.status = "ready"
        db.commit()
    except WebsiteFetchError as e:
        source.status = "failed"
        row.status = "failed"
        row.error = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        source.status = "failed"
        row.status = "failed"
        row.error = "Unexpected error while indexing this page."
        db.commit()
        raise HTTPException(status_code=500, detail=f"Indexing failed: {e}")

    return {"id": row.id, "url": row.url, "status": row.status, "error": row.error}


@router.post("/leetcode")
def add_leetcode_profile(
    payload: UsernamePayload,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    row = LeetCodeProfile(owner_id=user_id, username=payload.username, status="processing")
    db.add(row)
    db.flush()

    source = KnowledgeSource(
        owner_id=user_id, type="leetcode", title=f"LeetCode — {payload.username}", status="processing"
    )
    db.add(source)
    db.flush()
    row.source_id = source.id
    db.commit()

    try:
        result = fetch_profile(payload.username)
        row.solved_data = result["solved_data"]
        index_text(db, source, result["text"])
        source.status = "ready"
        row.status = "ready"
        db.commit()
    except LeetCodeFetchError as e:
        source.status = "failed"
        row.status = "failed"
        row.error = str(e)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        source.status = "failed"
        row.status = "failed"
        row.error = "Unexpected error while indexing this profile."
        db.commit()
        raise HTTPException(status_code=500, detail=f"Indexing failed: {e}")

    return {
        "id": row.id,
        "username": row.username,
        "status": row.status,
        "error": row.error,
        "solved_data": row.solved_data,
    }