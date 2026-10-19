
import asyncio

from app.main import app
from app.graphs import rag_graph


async def main():
    async with app.router.lifespan_context(app):
        database = app.state.mongodb

        result = await rag_graph.ainvoke({
            "database": database,
            "repository_id": "6acd2a1c032aeb7e923dee84",
            "query": "Explain the main components of this repository.",
            "limit": 5,
        })

        print("\n--- GENERATED ANSWER ---\n")
        print(result["answer"])


if __name__ == "__main__":
    asyncio.run(main())