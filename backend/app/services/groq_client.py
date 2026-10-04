from groq import Groq
from app.core.config import settings

_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None

NOT_CONFIGURED_MESSAGE = (
    "GROQ_API_KEY is not configured. Set it in your environment to enable "
    "AI responses."
)


def generate_response(system_prompt: str, user_message: str, history: list[dict]) -> str:
    if _client is None:
        return NOT_CONFIGURED_MESSAGE

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    completion = _client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        temperature=0.4,
    )
    return completion.choices[0].message.content


def stream_response(system_prompt: str, user_message: str, history: list[dict]):
    """Yields response text incrementally. Mirrors generate_response's
    behavior (including the same placeholder) when no key is configured,
    so callers don't need two separate code paths."""
    if _client is None:
        yield NOT_CONFIGURED_MESSAGE
        return

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    stream = _client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        temperature=0.4,
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta