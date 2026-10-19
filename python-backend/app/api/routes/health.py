
from fastapi import APIRouter, Request
from pymongo.errors import PyMongoError

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health(request: Request) -> dict:
    database = request.app.state.mongodb

    try:
        await database.command("ping")

        return {
            "status": "ok",
            "database": "connected",
        }
    except PyMongoError:
        return {
            "status": "error",
            "database": "unavailable",
        }
