from app.services.embeddings import embed_texts
from app.services import vectorstore, groq_client

SYSTEM_PROMPT = """You are i.vision, the user's personal AI knowledge assistant.
Use the provided context from the user's own knowledge base whenever it is relevant.
If the context does not contain the answer, say so honestly instead of inventing information.
Always keep responses clear, well structured, and never fabricate sources."""


def build_context_block(retrieved: list[dict]) -> str:
    if not retrieved:
        return "No relevant personal knowledge was found for this query."
    parts = []
    for i, r in enumerate(retrieved, start=1):
        parts.append(f"[{i}] Source: {r['source_title']}\n{r['chunk_text']}")
    return "\n\n".join(parts)


def answer_query(owner_id: str, query: str, history: list[dict], top_k: int = 5):
    query_vector = embed_texts([query])[0]
    retrieved = vectorstore.search(owner_id, query_vector, top_k=top_k)

    context_block = build_context_block(retrieved)
    prompt = (
        f"Relevant personal knowledge:\n{context_block}\n\n"
        f"User question: {query}"
    )

    answer = groq_client.generate_response(SYSTEM_PROMPT, prompt, history)

    citations = [
        {
            "source_title": r["source_title"],
            "chunk_text": r["chunk_text"][:280],
            "score": round(r["score"], 4),
        }
        for r in retrieved
        if r["score"] > 0.3
    ]

    return answer, citations
