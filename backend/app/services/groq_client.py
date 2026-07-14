from groq import Groq
from app.core.config import settings

_client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None


def generate_response(system_prompt: str, user_message: str, history: list[dict]) -> str:
    if _client is None:
        return (
            "GROQ_API_KEY is not configured. Set it in your environment to enable "
            "AI responses."
        )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    completion = _client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=messages,
        temperature=0.4,
    )
    return completion.choices[0].message.content
