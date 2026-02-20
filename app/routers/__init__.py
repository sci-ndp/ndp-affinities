from app.routers.endpoints import router as endpoints_router
from app.routers.datasets import router as datasets_router
from app.routers.services import router as services_router
from app.routers.dataset_endpoints import router as dataset_endpoints_router
from app.routers.dataset_services import router as dataset_services_router
from app.routers.service_endpoints import router as service_endpoints_router
from app.routers.affinities import router as affinities_router
from app.routers.linked import router as linked_router

__all__ = [
    "endpoints_router",
    "datasets_router",
    "services_router",
    "dataset_endpoints_router",
    "dataset_services_router",
    "service_endpoints_router",
    "affinities_router",
    "linked_router",
]
