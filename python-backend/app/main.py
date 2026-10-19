
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes.chat import router as chat_router
from app.api.routes.health import router as health_router
from app.api.routes.indexing import router as indexing_router
from app.api.routes.retrieval import router as retrieval_router
from app.api.routes.conversations import router as conversations_router
from app.core.logging import configure_logging
from app.db.mongodb import lifespan
from app.graphs.rag_graph import build_rag_graph


configure_logging()


@asynccontextmanager
async def application_lifespan(app: FastAPI):
    async with lifespan(app):
        app.state.rag_graph = build_rag_graph(
            checkpointer=app.state.checkpointer
        )
        yield


app = FastAPI(
    title="AI Codebase Intelligence",
    description="AI-powered repository understanding service",
    version="0.1.0",
    lifespan=application_lifespan,
)


@app.exception_handler(Exception)
async def unhandled_exception(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    import logging

    logging.getLogger(__name__).exception(
        "Unhandled application error"
    )

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(health_router, prefix="/api/v1")
app.include_router(indexing_router, prefix="/api/v1")
app.include_router(retrieval_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api/v1")