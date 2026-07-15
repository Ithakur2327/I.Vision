import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    PayloadSchemaType,
)

from app.core.config import settings

COLLECTION = "ivision_knowledge"

_client = QdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY or None,
)


def ensure_collection():
    collections = [c.name for c in _client.get_collections().collections]
    if COLLECTION not in collections:
        _client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(
                size=settings.EMBEDDING_DIM, distance=Distance.COSINE
            ),
        )
    # Qdrant requires an explicit payload index on any field used in a
    # query_filter. Without these, filtered search/delete calls fail with
    # "Index required but not found for ...". Creating an index that
    # already exists is a harmless no-op, so this is safe to call every time.
    for field in ("owner_id", "source_id"):
        _client.create_payload_index(
            collection_name=COLLECTION,
            field_name=field,
            field_schema=PayloadSchemaType.KEYWORD,
        )


def upsert_chunks(
    owner_id: str, source_id: str, source_title: str, chunks: list[str], vectors: list[list[float]]
) -> list[str]:
    ensure_collection()
    point_ids = []
    points = []
    for chunk, vector in zip(chunks, vectors):
        point_id = str(uuid.uuid4())
        point_ids.append(point_id)
        points.append(
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "owner_id": owner_id,
                    "source_id": source_id,
                    "source_title": source_title,
                    "chunk_text": chunk,
                },
            )
        )
    _client.upsert(collection_name=COLLECTION, points=points)
    return point_ids


def search(owner_id: str, query_vector: list[float], top_k: int = 5):
    ensure_collection()
    results = _client.search(
        collection_name=COLLECTION,
        query_vector=query_vector,
        query_filter=Filter(
            must=[FieldCondition(key="owner_id", match=MatchValue(value=owner_id))]
        ),
        limit=top_k,
    )
    return [
        {
            "score": r.score,
            "chunk_text": r.payload.get("chunk_text"),
            "source_title": r.payload.get("source_title"),
        }
        for r in results
    ]


def delete_source(source_id: str):
    ensure_collection()
    _client.delete(
        collection_name=COLLECTION,
        points_selector=Filter(
            must=[FieldCondition(key="source_id", match=MatchValue(value=source_id))]
        ),
    )