
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pymongo.errors import PyMongoError

from app.core.config import settings
from app.repositories.mongo_repository import (
    get_owned_repository,
    parse_object_id,
)
from app.services.indexing_service import index_repository

router = APIRouter(
    prefix="/repositories",
    tags=["Repository Indexing"],
)


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
            detail="Invalid internal service credentials",
        )

    parse_object_id(x_user_id, "user ID")
    return x_user_id


@router.post("/{repository_id}/index")
async def index_repository_endpoint(
    repository_id: str,
    request: Request,
    user_id: str = Depends(verify_internal_request),
):
    database = request.app.state.mongodb

    # Never trust a repository ID alone; check its owner first.
    repository = await get_owned_repository(
        database,
        repository_id,
        user_id,
    )

    try:
        result = await index_repository(database, repository)
        return {"success": True, "data": result}

    except HTTPException:
        raise

    except (PyMongoError, ValueError, RuntimeError):
        raise HTTPException(
            status_code=500,
            detail="Repository indexing failed",
        )


@router.get("/{repository_id}/index-status")
async def get_index_status(
    repository_id: str,
    request: Request,
    user_id: str = Depends(verify_internal_request),
):
    database = request.app.state.mongodb

    repository = await get_owned_repository(
        database,
        repository_id,
        user_id,
    )

    status = await database[
        settings.index_status_collection
    ].find_one({"_id": repository["_id"]})

    if not status:
        return {
            "success": True,
            "data": {"status": "not_indexed"},
        }

    return {
        "success": True,
        "data": {
            "status": status.get("status", "unknown"),
            "indexedFiles": status.get("indexedFiles", 0),
            "skippedFiles": status.get("skippedFiles", 0),
            "chunkCount": status.get("chunkCount", 0),
            "completedAt": status.get("completedAt"),
        },
    }
