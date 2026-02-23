from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.affinity_triple import AffinityTriple
from app.models.dataset import Dataset
from app.models.dataset_endpoint import DatasetEndpoint
from app.models.dataset_service import DatasetService
from app.models.endpoint import Endpoint
from app.models.service import Service
from app.models.service_endpoint import ServiceEndpoint
from app.schemas.linked import LinkedEntitiesResponse, LinkedNode

router = APIRouter(prefix="/linked", tags=["linked"])


def _endpoint_display_name(endpoint: Endpoint) -> str:
    if endpoint.kind and endpoint.url:
        return f"{endpoint.kind}: {endpoint.url}"
    return endpoint.kind or endpoint.url or str(endpoint.uid)


def _service_display_name(service: Service) -> str:
    return service.type or service.openapi_url or str(service.uid)


@router.get("/{uid}", response_model=LinkedEntitiesResponse)
def get_linked_entities(uid: UUID, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.uid == uid).first()
    endpoint = db.query(Endpoint).filter(Endpoint.uid == uid).first()
    service = db.query(Service).filter(Service.uid == uid).first()

    if not any([dataset, endpoint, service]):
        raise HTTPException(status_code=404, detail="No dataset, endpoint, or service found for the given uid")

    dataset_uids: set[UUID] = set()
    endpoint_uids: set[UUID] = set()
    service_uids: set[UUID] = set()

    if dataset:
        input_type = "dataset"
        endpoint_uids.update(
            row.endpoint_uid
            for row in db.query(DatasetEndpoint).filter(DatasetEndpoint.dataset_uid == uid).all()
        )
        service_uids.update(
            row.service_uid
            for row in db.query(DatasetService).filter(DatasetService.dataset_uid == uid).all()
        )
        for affinity in db.query(AffinityTriple).filter(AffinityTriple.dataset_uid == uid).all():
            endpoint_uids.update(affinity.endpoint_uids or [])
            service_uids.update(affinity.service_uids or [])

    elif endpoint:
        input_type = "endpoint"
        dataset_uids.update(
            row.dataset_uid
            for row in db.query(DatasetEndpoint).filter(DatasetEndpoint.endpoint_uid == uid).all()
        )
        service_uids.update(
            row.service_uid
            for row in db.query(ServiceEndpoint).filter(ServiceEndpoint.endpoint_uid == uid).all()
        )
        for affinity in db.query(AffinityTriple).all():
            affinity_endpoint_uids = affinity.endpoint_uids or []
            if uid in affinity_endpoint_uids:
                if affinity.dataset_uid:
                    dataset_uids.add(affinity.dataset_uid)
                endpoint_uids.update(affinity_endpoint_uids)
                service_uids.update(affinity.service_uids or [])

    else:
        input_type = "service"
        dataset_uids.update(
            row.dataset_uid
            for row in db.query(DatasetService).filter(DatasetService.service_uid == uid).all()
        )
        endpoint_uids.update(
            row.endpoint_uid
            for row in db.query(ServiceEndpoint).filter(ServiceEndpoint.service_uid == uid).all()
        )
        for affinity in db.query(AffinityTriple).all():
            affinity_service_uids = affinity.service_uids or []
            if uid in affinity_service_uids:
                if affinity.dataset_uid:
                    dataset_uids.add(affinity.dataset_uid)
                endpoint_uids.update(affinity.endpoint_uids or [])
                service_uids.update(affinity_service_uids)

    dataset_uids.discard(uid)
    endpoint_uids.discard(uid)
    service_uids.discard(uid)

    datasets = []
    if dataset_uids:
        datasets = db.query(Dataset).filter(Dataset.uid.in_(dataset_uids)).all()

    endpoints = []
    if endpoint_uids:
        endpoints = db.query(Endpoint).filter(Endpoint.uid.in_(endpoint_uids)).all()

    services = []
    if service_uids:
        services = db.query(Service).filter(Service.uid.in_(service_uids)).all()

    return LinkedEntitiesResponse(
        input_uid=uid,
        input_type=input_type,
        datasets=sorted(
            [LinkedNode(uid=item.uid, name=item.title) for item in datasets],
            key=lambda x: str(x.uid),
        ),
        endpoints=sorted(
            [LinkedNode(uid=item.uid, name=_endpoint_display_name(item)) for item in endpoints],
            key=lambda x: str(x.uid),
        ),
        services=sorted(
            [LinkedNode(uid=item.uid, name=_service_display_name(item)) for item in services],
            key=lambda x: str(x.uid),
        ),
    )
