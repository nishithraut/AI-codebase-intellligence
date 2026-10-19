from google import genai
from google.genai import types

from app.core.config import get_settings


class GeminiEmbeddingService:
    def __init__(self):
        settings = get_settings()

        self.client = genai.Client(
            api_key=settings.gemini_api_key
        )
        self.model = settings.gemini_embedding_model
        self.dimensions = settings.gemini_embedding_dimensions
        self.batch_size = settings.embedding_batch_size

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Generate vectors for code chunks using document retrieval mode."""
        if not texts:
            return []

        if any(not text.strip() for text in texts):
            raise ValueError("Embedding input cannot contain empty text.")

        vectors = []

        for start in range(0, len(texts), self.batch_size):
            batch = texts[start : start + self.batch_size]

            response = await self.client.aio.models.embed_content(
                model=self.model,
                contents=batch,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                    output_dimensionality=self.dimensions,
                ),
            )

            embeddings = response.embeddings or []

            if len(embeddings) != len(batch):
                raise RuntimeError(
                    "Gemini returned an unexpected number of embeddings."
                )

            for embedding in embeddings:
                values = embedding.values

                if values is None or len(values) != self.dimensions:
                    raise RuntimeError(
                        "Gemini returned an embedding with unexpected dimensions."
                    )

                vectors.append(values)

        return vectors

    async def embed_query(self, text: str) -> list[float]:
        """Generate a query vector using retrieval query mode."""
        if not text.strip():
            raise ValueError("Query cannot be empty.")

        response = await self.client.aio.models.embed_content(
            model=self.model,
            contents=text,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
                output_dimensionality=self.dimensions,
            ),
        )

        embeddings = response.embeddings or []

        if len(embeddings) != 1 or embeddings[0].values is None:
            raise RuntimeError("Gemini did not return a valid query embedding.")

        vector = embeddings[0].values

        if len(vector) != self.dimensions:
            raise RuntimeError(
                "Gemini returned a query vector with unexpected dimensions."
            )

        return vector

    async def close(self) -> None:
        await self.client.aio.aclose()