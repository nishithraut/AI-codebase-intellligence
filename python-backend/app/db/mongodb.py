
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from pymongo import AsyncMongoClient, MongoClient
from pymongo.errors import PyMongoError
from langgraph.checkpoint.mongodb import MongoDBSaver

from app.core.config import settings


client: AsyncMongoClient | None = None
checkpointer_client: MongoClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    global client, checkpointer_client

    if not settings.mongodb_database:
        raise RuntimeError("MONGODB_DATABASE must be configured.")

    client = AsyncMongoClient(settings.mongodb_uri)
    checkpointer_client = MongoClient(settings.mongodb_uri)

    try:
        await client.admin.command("ping")
        checkpointer_client.admin.command("ping")

        database = client[settings.mongodb_database]
        app.state.mongodb = database

        conversations = database[settings.conversations_collection]

        await conversations.create_index(
            [("conversationId", 1)],
            unique=True,
        )
        await conversations.create_index(
            [("userId", 1), ("repositoryId", 1), ("updatedAt", -1)]
        )

        app.state.checkpointer = MongoDBSaver(
            checkpointer_client,
            db_name=settings.mongodb_database,
            checkpoint_collection_name="langgraph_checkpoints",
            writes_collection_name="langgraph_checkpoint_writes",
        )

        yield

    except PyMongoError:
        raise

    finally:
        if checkpointer_client is not None:
            checkpointer_client.close()
            checkpointer_client = None

        if client is not None:
            await client.close()
            client = None
