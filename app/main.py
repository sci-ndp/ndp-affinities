import re

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    error_msg = str(exc.orig) if exc.orig else str(exc)

    if "foreign key constraint" in error_msg.lower() or "violates foreign key" in error_msg.lower():
        match = re.search(r'Key \((\w+)\)=\(([^)]+)\)', error_msg)
        if match:
            field, value = match.groups()
            detail = f"Referenced {field} '{value}' does not exist"
        else:
            detail = "Referenced entity does not exist"
        return JSONResponse(status_code=400, content={"detail": detail})

    if "unique constraint" in error_msg.lower() or "duplicate key" in error_msg.lower():
        return JSONResponse(status_code=409, content={"detail": "Resource already exists"})

    return JSONResponse(status_code=400, content={"detail": "Database integrity error"})

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
