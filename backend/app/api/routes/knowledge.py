import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.models import KnowledgeSource, Document, EmbeddingMetadata
from app.schemas.schemas import KnowledgeSourceOut
from app.core.security import get_current_user_id
from app.core.config import settings
from app.services.extraction import extract_text, validate_file
from app.services.embeddings import chunk_text, embed_texts
from app.services import vectorstore

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@router.post("/documents", response_model=KnowledgeSourceOut)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    content = await file.read()
    try:
        file_type = validate_file(file.filename, len(content))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    source = KnowledgeSource(
        owner_id=user_id, type="document", title=file.filename, status="processing"
    )
    db.add(source)
    db.flush()

    stored_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    with open(file_path, "wb") as f:
        f.write(content)

    document = Document(
        source_id=source.id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_type,
        size_bytes=len(content),
        status="processing",
    )
    db.add(document)
    db.commit()

    try:
        text = extract_text(file_path, file_type)
        chunks = chunk_text(text)
        if chunks:
            vectors = embed_texts(chunks)
            point_ids = vectorstore.upsert_chunks(
                user_id, source.id, source.title, chunks, vectors
            )
            for idx, (chunk, point_id) in enumerate(zip(chunks, point_ids)):
                db.add(
                    EmbeddingMetadata(
                        source_id=source.id,
                        qdrant_point_id=point_id,
                        chunk_index=idx,
                        chunk_text=chunk,
                    )
                )
        source.status = "ready"
        document.status = "ready"
    except Exception as e:
        source.status = "failed"
        document.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")

    db.commit()
    db.refresh(source)
    return source


@router.get("", response_model=List[KnowledgeSourceOut])
def list_knowledge(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    return (
        db.query(KnowledgeSource)
        .filter(KnowledgeSource.owner_id == user_id)
        .order_by(KnowledgeSource.created_at.desc())
        .all()
    )


@router.delete("/{source_id}")
def delete_knowledge(
    source_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    source = (
        db.query(KnowledgeSource)
        .filter(KnowledgeSource.id == source_id, KnowledgeSource.owner_id == user_id)
        .first()
    )
    if not source:
        raise HTTPException(status_code=404, detail="Knowledge source not found")

    vectorstore.delete_source(source_id)
    db.delete(source)
    db.commit()
    return {"status": "deleted", "id": source_id}
