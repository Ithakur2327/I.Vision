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


def retrieve(owner_id: str, query: str, top_k: int = 5):
    """Embeds the query, searches the vector store, and returns both a
    prompt-ready context block and a citations list. Shared by the
    streaming and non-streaming answer paths so retrieval only happens once
    per call site and behaves identically either way."""
    query_vector = embed_texts([query])[0]
    retrieved = vectorstore.search(owner_id, query_vector, top_k=top_k)

    citations = [
        {
            "source_title": r["source_title"],
            "chunk_text": r["chunk_text"][:280],
            "score": round(r["score"], 4),
        }
        for r in retrieved
        if r["score"] > 0.3
    ]
    return build_context_block(retrieved), citations


def _build_prompt(context_block: str, query: str) -> str:
    return f"Relevant personal knowledge:\n{context_block}\n\nUser question: {query}"


def answer_query(owner_id: str, query: str, history: list[dict], top_k: int = 5):
    context_block, citations = retrieve(owner_id, query, top_k)
    answer = groq_client.generate_response(SYSTEM_PROMPT, _build_prompt(context_block, query), history)
    return answer, citations


def stream_answer(owner_id: str, query: str, history: list[dict], top_k: int = 5):
    """Returns (token_generator, citations). Citations are known immediately
    since retrieval happens before generation starts — only the answer text
    itself streams in."""
    context_block, citations = retrieve(owner_id, query, top_k)
    token_stream = groq_client.stream_response(SYSTEM_PROMPT, _build_prompt(context_block, query), history)
    return token_stream, citations