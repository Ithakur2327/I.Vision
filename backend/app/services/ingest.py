from sqlalchemy.orm import Session

from app.models.models import KnowledgeSource, EmbeddingMetadata
from app.services.embeddings import chunk_text, embed_texts
from app.services import vectorstore


def index_text(db: Session, source: KnowledgeSource, text: str) -> int:
    """Chunk, embed, and store `text` under an already-created KnowledgeSource.

    Returns the number of chunks stored. The caller owns `source.status`
    and committing the session — this only adds EmbeddingMetadata rows and
    upserts into the vector store.
    """
    chunks = chunk_text(text)
    if not chunks:
        return 0

    vectors = embed_texts(chunks)
    point_ids = vectorstore.upsert_chunks(
        source.owner_id, source.id, source.title, chunks, vectors
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
    return len(chunks)