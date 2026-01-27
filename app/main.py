from fastapi import FastAPI

from app.routers import endpoints_router

app = FastAPI(
    title="NDP Affinities API",
    description="API for managing NDP affinities data",
    version="0.1.0",
)

app.include_router(endpoints_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
