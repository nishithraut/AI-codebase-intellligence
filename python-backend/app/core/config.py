from pydantic import Field
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_database: str | None = None

    gemini_api_key: str
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_embedding_model: str = "gemini-embedding-001"

    internal_api_secret: str
    log_level: str = "INFO"

    repositories_collection: str = Field(
        default="repositories",
        validation_alias="MONGODB_REPOSITORIES_COLLECTION",
    )

    repository_files_collection: str = Field(
        default="repositoryfiles",
        validation_alias="MONGODB_REPOSITORY_FILES_COLLECTION",
    )

    chunks_collection: str = Field(
        default="repositorychunks",
        validation_alias="MONGODB_CHUNKS_COLLECTION",
    )

    index_status_collection: str = Field(
        default="repositoryindexstatus",
        validation_alias="MONGODB_INDEX_STATUS_COLLECTION",
    )

    vector_search_index_name: str = "repository_chunks_vector_index"

    conversations_collection: str = Field(
        default="conversations",
        validation_alias="MONGODB_CONVERSATIONS_COLLECTION",
    )

    max_repository_files: int = 5000
    max_file_size_bytes: int = 1_000_000
    max_chunk_chars: int = 12000
    chunk_overlap_lines: int = 5

    max_chunks_per_repository: int = 50000

    gemini_embedding_dimensions: int = 768
    embedding_batch_size: int = 64

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
