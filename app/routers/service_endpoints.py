from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.endpoint import Endpoint
from app.models.service import Service
from app.models.service_endpoint import ServiceEndpoint
from app.schemas.service_endpoint import ServiceEndpointCreate, ServiceEndpointResponse

router = APIRouter(prefix="/service-endpoints", tags=["service-endpoints"])


def validate_references(db: Session, service_uid: UUID, endpoint_uid: UUID):
    if not db.query(Service).filter(Service.uid == service_uid).first():
        raise HTTPException(status_code=404, detail=f"Service '{service_uid}' not found")
    if not db.query(Endpoint).filter(Endpoint.uid == endpoint_uid).first():
        raise HTTPException(status_code=404, detail=f"Endpoint '{endpoint_uid}' not found")


@router.get("", response_model=list[ServiceEndpointResponse])
def list_service_endpoints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(ServiceEndpoint).offset(skip).limit(limit).all()


@router.get("/{service_uid}/{endpoint_uid}", response_model=ServiceEndpointResponse)
def get_service_endpoint(service_uid: UUID, endpoint_uid: UUID, db: Session = Depends(get_db)):
    item = db.query(ServiceEndpoint).filter(
        ServiceEndpoint.service_uid == service_uid,
        ServiceEndpoint.endpoint_uid == endpoint_uid
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="ServiceEndpoint not found")
    return item


@router.post("", response_model=ServiceEndpointResponse, status_code=201)
def create_service_endpoint(data: ServiceEndpointCreate, db: Session = Depends(get_db)):
    validate_references(db, data.service_uid, data.endpoint_uid)
    item = ServiceEndpoint(
        service_uid=data.service_uid,
        endpoint_uid=data.endpoint_uid,
        role=data.role,
        attrs=data.attrs,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{service_uid}/{endpoint_uid}", status_code=204)
def delete_service_endpoint(service_uid: UUID, endpoint_uid: UUID, db: Session = Depends(get_db)):
    item = db.query(ServiceEndpoint).filter(
        ServiceEndpoint.service_uid == service_uid,
        ServiceEndpoint.endpoint_uid == endpoint_uid
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="ServiceEndpoint not found")
    db.delete(item)
    db.commit()
