
import secrets

from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, Request

from app.core.config import settings
from app.repositories.mongo_repository import parse_object_id


router = APIRouter(prefix="/conversations", tags=["Conversations"])


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


def message_text(content) -> str:
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []

        for block in content:
            if isinstance(block, dict):
                text = block.get("text")
            else:
                text = getattr(block, "text", None)

            if isinstance(text, str):
                parts.append(text)

        return "\n".join(parts)

    return str(content)


def serialize_message(message) -> dict | None:
    message_type = getattr(message, "type", None)

    if message_type == "human":
        role = "user"
    elif message_type == "ai":
        role = "assistant"
    else:
        return None

    return {
        "role": role,
        "content": message_text(message.content),
    }


@router.get("")
async def list_conversations(
    request: Request,
    user_id: str = Depends(verify_internal_request),
):
    database = request.app.state.mongodb

    cursor = database[settings.conversations_collection].find(
        {"userId": ObjectId(user_id)}
    ).sort("updatedAt", -1)

    conversations = []

    async for conversation in cursor:
        repository = await database[
            settings.repositories_collection
        ].find_one(
            {
                "_id": conversation["repositoryId"],
                "userId": ObjectId(user_id),
            },
            {"name": 1},
        )

        if not repository:
            continue

        conversations.append(
            {
                "conversationId": conversation["conversationId"],
                "repositoryId": str(conversation["repositoryId"]),
                "repositoryName": repository.get("name", "Unknown repository"),
                "title": conversation.get("title", "New conversation"),
                "createdAt": conversation.get("createdAt"),
                "updatedAt": conversation.get("updatedAt"),
            }
        )

    return {"success": True, "data": {"conversations": conversations}}


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    request: Request,
    user_id: str = Depends(verify_internal_request),
):
    database = request.app.state.mongodb

    conversation = await database[
        settings.conversations_collection
    ].find_one(
        {
            "conversationId": conversation_id,
            "userId": ObjectId(user_id),
        }
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    repository = await database[
        settings.repositories_collection
    ].find_one(
        {
            "_id": conversation["repositoryId"],
            "userId": ObjectId(user_id),
        },
        {"name": 1},
    )

    if not repository:
        raise HTTPException(
            status_code=404,
            detail="Repository not found.",
        )

    graph = request.app.state.rag_graph

    checkpoint = await graph.aget_state(
        {"configurable": {"thread_id": conversation_id}}
    )

    state = checkpoint.values if checkpoint else {}
    messages = [
        serialized
        for message in state.get("messages", [])
        if (serialized := serialize_message(message)) is not None
    ]

    return {
        "success": True,
        "data": {
            "conversationId": conversation_id,
            "repositoryId": str(conversation["repositoryId"]),
            "repositoryName": repository.get("name", "Unknown repository"),
            "title": conversation.get("title", "New conversation"),
            "messages": messages,
        },
    }
