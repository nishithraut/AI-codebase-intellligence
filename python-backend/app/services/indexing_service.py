
import hashlib
import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException

from app.chunkers.common import redact_secrets, should_skip_file
from app.chunkers.registry import chunk_file
from app.core.config import settings
from app.embeddings.gemini_embeddings import GeminiEmbeddingService
from app.repositories.mongo_repository import get_repository_files

logger = logging.getLogger(__name__)

BATCH_SIZE = 64


async def index_repository(database, repository: dict) -> dict:
    repository_id = repository["_id"]
    files = await get_repository_files(database, repository_id)

    if len(files) > settings.max_repository_files:
        raise HTTPException(
            status_code=413,
            detail="Repository contains too many files.",
        )

    run_id = uuid4().hex
    now = datetime.now(timezone.utc)

    chunks_collection = database[settings.chunks_collection]
    status_collection = database[settings.index_status_collection]

    await status_collection.update_one(
        {"_id": repository_id},
        {
            "$set": {
                "status": "indexing",
                "pendingRunId": run_id,
                "startedAt": now,
            }
        },
        upsert=True,
    )

    embedding_service = None
    batch: list[dict] = []
    total_chunks = 0
    indexed_files = 0
    skipped_files = 0

    async def flush_batch():
        if not batch:
            return

        texts = [
            f"File: {document['path']}\n"
            f"Language: {document['language']}\n\n"
            f"{document['content']}"
            for document in batch
        ]

        vectors = await embedding_service.embed_documents(texts)

        for document, vector in zip(batch, vectors):
            document["embedding"] = vector

        await chunks_collection.insert_many(batch, ordered=True)
        batch.clear()

    try:
        await chunks_collection.create_index(
            [("repositoryId", 1), ("runId", 1)]
        )

        embedding_service = GeminiEmbeddingService()

        for file in files:
            path = file.get("path")
            content = file.get("content")

            if not isinstance(path, str) or not isinstance(content, str):
                skipped_files += 1
                continue

            if should_skip_file(path, content):
                skipped_files += 1
                continue

            safe_content = redact_secrets(content)
            chunks = chunk_file(path, safe_content)

            if not chunks:
                skipped_files += 1
                continue

            indexed_files += 1

            for chunk in chunks:
                total_chunks += 1

                if total_chunks > settings.max_chunks_per_repository:
                    raise ValueError(
                        "Repository exceeded the maximum chunk limit"
                    )

                digest = hashlib.sha256(
                    chunk.content.encode("utf-8")
                ).hexdigest()

                batch.append(
                    {
                        "repositoryId": repository_id,
                        "runId": run_id,
                        "fileId": file.get("_id"),
                        "path": chunk.path,
                        "language": chunk.language,
                        "content": chunk.content,
                        "startLine": chunk.start_line,
                        "endLine": chunk.end_line,
                        "chunkIndex": chunk.chunk_index,
                        "metadata": chunk.metadata,
                        "contentHash": digest,
                        "createdAt": now,
                    }
                )

                if len(batch) >= BATCH_SIZE:
                    await flush_batch()

        await flush_batch()

        result = await status_collection.update_one(
            {"_id": repository_id, "pendingRunId": run_id},
            {
                "$set": {
                    "status": "ready",
                    "activeRunId": run_id,
                    "indexedFiles": indexed_files,
                    "skippedFiles": skipped_files,
                    "chunkCount": total_chunks,
                    "completedAt": datetime.now(timezone.utc),
                },
                "$unset": {"pendingRunId": ""},
            },
        )

        if result.matched_count != 1:
            raise RuntimeError(
                "Indexing run lost ownership of its status"
            )

        try:
            await chunks_collection.delete_many(
                {
                    "repositoryId": repository_id,
                    "runId": {"$ne": run_id},
                }
            )
        except Exception:
            logger.exception(
                "Old chunk cleanup failed for repository %s",
                repository_id,
            )

        return {
            "repositoryId": str(repository_id),
            "status": "ready",
            "indexedFiles": indexed_files,
            "skippedFiles": skipped_files,
            "chunkCount": total_chunks,
            "runId": run_id,
        }

    except Exception:
        logger.exception(
            "Repository indexing failed for repository %s",
            repository_id,
        )

        await chunks_collection.delete_many(
            {
                "repositoryId": repository_id,
                "runId": run_id,
            }
        )

        await status_collection.update_one(
            {"_id": repository_id, "pendingRunId": run_id},
            {
                "$set": {
                    "status": "failed",
                    "failedAt": datetime.now(timezone.utc),
                },
                "$unset": {"pendingRunId": ""},
            },
        )

        raise

    finally:
        if embedding_service is not None:
            try:
                await embedding_service.close()
            except Exception:
                logger.exception("Failed to close Gemini embedding client")
