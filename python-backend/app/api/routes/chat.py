
import asyncio
import json
import logging
import secrets

from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import settings
from app.repositories.mongo_repository import get_owned_repository, parse_object_id
from app.services.conversation_service import create_or_get_conversation


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/repositories",
    tags=["Chat"],
)


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    query: str = Field(min_length=1, max_length=10000)
    conversation_id: str | None = Field(
        default=None,
        alias="conversationId",
        min_length=1,
        max_length=64,
    )
    limit: int = Field(default=5, ge=1, le=10)


async def verify_internal_request(
    x_internal_api_secret: str = Header(alias="X-Internal-Api-Secret"),
    x_user_id: str = Header(alias="X-User-Id"),
) -> str:
    if not secrets.compare_digest(
        x_internal_api_secret,
        settings.internal_api_secret,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid internal service credentials.",
        )

    parse_object_id(x_user_id, "user ID")
    return x_user_id


async def prepare_chat(
    repository_id: str,
    body: ChatRequest,
    request: Request,
    user_id: str,
):
    if not body.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty.",
        )

    database = request.app.state.mongodb

    repository = await get_owned_repository(
        database,
        repository_id,
        user_id,
    )

    conversation_id = await create_or_get_conversation(
        database=database,
        user_id=ObjectId(user_id),
        repository_id=repository["_id"],
        conversation_id=body.conversation_id,
        query=body.query,
    )

    return database, repository, conversation_id


def sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/{repository_id}/chat")
async def chat_with_repository(
    repository_id: str,
    body: ChatRequest,
    request: Request,
    user_id: str = Depends(verify_internal_request),
):
    database, repository, conversation_id = await prepare_chat(
        repository_id,
        body,
        request,
        user_id,
    )

    graph = request.app.state.rag_graph

    result = await graph.ainvoke(
        {
            "repository_id": str(repository["_id"]),
            "query": body.query.strip(),
            "limit": body.limit,
            "messages": [
                {"role": "user", "content": body.query.strip()}
            ],
        },
        config={
            "configurable": {
                "thread_id": conversation_id,
                "database": database,
            }
        },
    )

    sources = [
        {
            "path": chunk.get("path"),
            "language": chunk.get("language"),
            "startLine": chunk.get("startLine"),
            "endLine": chunk.get("endLine"),
            "score": chunk.get("score"),
        }
        for chunk in result.get("chunks", [])
    ]

    return {
        "success": True,
        "data": {
            "conversationId": conversation_id,
            "repositoryId": str(repository["_id"]),
            "answer": result["answer"],
            "sources": sources,
        },
    }


@router.post("/{repository_id}/chat/stream")
async def stream_chat_with_repository(
    repository_id: str,
    body: ChatRequest,
    request: Request,
    user_id: str = Depends(verify_internal_request),
):
    database, repository, conversation_id = await prepare_chat(
        repository_id,
        body,
        request,
        user_id,
    )

    graph = request.app.state.rag_graph

    graph_input = {
        "repository_id": str(repository["_id"]),
        "query": body.query.strip(),
        "limit": body.limit,
        "messages": [
            {"role": "user", "content": body.query.strip()}
        ],
    }

    graph_config = {
        "configurable": {
            "thread_id": conversation_id,
            "database": database,
        }
    }

    async def generate_events():
        try:
            yield sse_event(
                "metadata",
                {
                    "conversationId": conversation_id,
                    "repositoryId": str(repository["_id"]),
                },
            )

            async for mode, payload in graph.astream(
                graph_input,
                config=graph_config,
                stream_mode=["custom", "values"],
            ):
                if mode == "custom" and payload.get("type") == "token":
                    yield sse_event(
                        "token",
                        {"content": payload.get("content", "")},
                    )

                elif mode == "values":
                    chunks = payload.get("chunks")

                    if chunks is not None:
                        sources = [
                            {
                                "path": chunk.get("path"),
                                "language": chunk.get("language"),
                                "startLine": chunk.get("startLine"),
                                "endLine": chunk.get("endLine"),
                                "score": chunk.get("score"),
                            }
                            for chunk in chunks
                        ]

                        yield sse_event("sources", {"sources": sources})

            yield sse_event("done", {"success": True})

        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Streaming repository chat failed")
            yield sse_event(
                "error",
                {"message": "The AI service failed while generating the answer."},
            )

    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    )
