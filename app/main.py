from fastapi import FastAPI

from app.routers import (
    endpoints_router,
    datasets_router,
    services_router,
    dataset_endpoints_router,
    dataset_services_router,
    service_endpoints_router,
    affinities_router,
)

app = FastAPI(
    title="NDP Affinities API",
    description="API for managing NDP affinities data",
    version="0.1.0",
)

app.include_router(endpoints_router)
app.include_router(datasets_router)
app.include_router(services_router)
app.include_router(dataset_endpoints_router)
app.include_router(dataset_services_router)
app.include_router(service_endpoints_router)
app.include_router(affinities_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
