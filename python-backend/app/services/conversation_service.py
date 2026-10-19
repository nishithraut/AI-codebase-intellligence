
from datetime import datetime, timezone
from uuid import uuid4

from bson import ObjectId
from fastapi import HTTPException

from app.core.config import settings


async def create_or_get_conversation(
    database,
    user_id: ObjectId,
    repository_id: ObjectId,
    conversation_id: str | None,
    query: str,
) -> str:
    collection = database[settings.conversations_collection]
    now = datetime.now(timezone.utc)

    if conversation_id:
        conversation = await collection.find_one(
            {
                "conversationId": conversation_id,
                "userId": user_id,
                "repositoryId": repository_id,
            }
        )

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found.",
            )

        await collection.update_one(
            {"_id": conversation["_id"]},
            {"$set": {"updatedAt": now}},
        )

        return conversation_id

    conversation_id = str(uuid4())

    await collection.insert_one(
        {
            "conversationId": conversation_id,
            "userId": user_id,
            "repositoryId": repository_id,
            "title": query.strip()[:80],
            "createdAt": now,
            "updatedAt": now,
        }
    )

    return conversation_id
