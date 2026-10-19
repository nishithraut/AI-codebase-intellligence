
from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_chat_model() -> ChatGoogleGenerativeAI:
    """
    Create and reuse the configured Gemini chat model.
    
    The model is initialized once and reused across requests.
    The API call happens later when the model is invoked.
    """
    settings = get_settings()

    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
    )
