from bson import ObjectId
from fastapi import HTTPException

from app.core.config import settings
from app.embeddings.gemini_embeddings import GeminiEmbeddingService


async def retrieve_code_chunks(
    database,
    repository_id: ObjectId,
    query: str,
    limit: int = 5,
) -> list[dict]:
    if not query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty.",
        )

    if not 1 <= limit <= 20:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 20.",
        )

    status_collection = database[settings.index_status_collection]
    chunks_collection = database[settings.chunks_collection]

    index_status = await status_collection.find_one(
        {"_id": repository_id},
        {"status": 1, "activeRunId": 1},
    )

    if (
        not index_status
        or index_status.get("status") != "ready"
        or not index_status.get("activeRunId")
    ):
        raise HTTPException(
            status_code=409,
            detail="Repository has no ready index.",
        )

    active_run_id = index_status["activeRunId"]

    embedding_service = GeminiEmbeddingService()

    try:
        query_vector = await embedding_service.embed_query(query)
    finally:
        await embedding_service.close()

    pipeline = [
        {
            "$vectorSearch": {
                "index": settings.vector_search_index_name,
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": max(limit * 20, 100),
                "limit": limit,
                "filter": {
                    "repositoryId": repository_id,
                    "runId": active_run_id,
                },
            }
        },
        {
            "$project": {
                "_id": 1,
                "path": 1,
                "language": 1,
                "content": 1,
                "startLine": 1,
                "endLine": 1,
                "metadata": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]

    cursor = await chunks_collection.aggregate(pipeline)
    results = await cursor.to_list(length=limit)

    for result in results:
        if "_id" in result:
            result["_id"] = str(result["_id"])

    return results