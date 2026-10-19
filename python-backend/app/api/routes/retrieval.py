from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from bson import ObjectId
import hmac

from app.core.config import get_settings
from app.repositories.mongo_repository import get_owned_repository
from app.services.retrieval_service import retrieve_code_chunks

router = APIRouter(
    prefix="/repositories",
    tags=["Retrieval"],
)

settings = get_settings()


class RetrievalRequest(BaseModel):
    query: str = Field(min_length=1, max_length=10000)
    limit: int = Field(default=5, ge=1, le=20)


async def verify_internal_request(
    x_internal_api_secret: str = Header(),
    x_user_id: str = Header(),
):
    if not hmac.compare_digest(
        x_internal_api_secret,
        settings.internal_api_secret,
    ):
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not ObjectId.is_valid(x_user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    return ObjectId(x_user_id)


@router.post("/{repository_id}/retrieve")
async def retrieve_repository_code(
    repository_id: str,
    body: RetrievalRequest,
    request: Request,
    user_id: ObjectId = Depends(verify_internal_request),
):
    if not ObjectId.is_valid(repository_id):
        raise HTTPException(status_code=400, detail="Invalid repository ID")

    database = request.app.state.mongodb

    repository = await get_owned_repository(
        database,
        repository_id,
        str(user_id),
    )

    results = await retrieve_code_chunks(
        database=database,
        repository_id=repository["_id"],
        query=body.query,
        limit=body.limit,
    )

    return {
        "repositoryId": str(repository["_id"]),
        "count": len(results),
        "results": results,
    }