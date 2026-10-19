
from bson import ObjectId
from fastapi import HTTPException
from pymongo.asynchronous.collection import AsyncCollection

from app.core.config import settings


def parse_object_id(value: str, field_name: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name}",
        )

    return ObjectId(value)


async def get_owned_repository(
    database,
    repository_id: str,
    user_id: str,
) -> dict:
    repo_object_id = parse_object_id(repository_id, "repository ID")
    user_object_id = parse_object_id(user_id, "user ID")

    repositories: AsyncCollection = database[
        settings.repositories_collection
    ]

    repository = await repositories.find_one(
        {
            "_id": repo_object_id,
            "userId": user_object_id,
        }
    )

    if repository is None:
        raise HTTPException(
            status_code=404,
            detail="Repository not found",
        )

    return repository


async def get_repository_files(database, repository_id: ObjectId):
    files: AsyncCollection = database[
        settings.repository_files_collection
    ]

    cursor = (
        files.find(
            {"repositoryId": repository_id},
            {"path": 1, "content": 1},
        )
        .limit(settings.max_repository_files + 1)
    )

    return await cursor.to_list(
        length=settings.max_repository_files + 1
    )
