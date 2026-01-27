from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.endpoint import Endpoint
from app.schemas.endpoint import EndpointCreate, EndpointUpdate, EndpointResponse

router = APIRouter(prefix="/ep", tags=["endpoints"])


@router.get("", response_model=list[EndpointResponse])
def list_endpoints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    endpoints = db.query(Endpoint).offset(skip).limit(limit).all()
    return endpoints


@router.get("/{uid}", response_model=EndpointResponse)
def get_endpoint(uid: UUID, db: Session = Depends(get_db)):
    endpoint = db.query(Endpoint).filter(Endpoint.uid == uid).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    return endpoint


@router.post("", response_model=EndpointResponse, status_code=201)
def create_endpoint(endpoint_in: EndpointCreate, db: Session = Depends(get_db)):
    endpoint = Endpoint(
        kind=endpoint_in.kind,
        url=endpoint_in.url,
        source_ep=endpoint_in.source_ep,
        metadata_=endpoint_in.metadata,
    )
    db.add(endpoint)
    db.commit()
    db.refresh(endpoint)
    return endpoint


@router.put("/{uid}", response_model=EndpointResponse)
def update_endpoint(uid: UUID, endpoint_in: EndpointUpdate, db: Session = Depends(get_db)):
    endpoint = db.query(Endpoint).filter(Endpoint.uid == uid).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    update_data = endpoint_in.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        update_data["metadata_"] = update_data.pop("metadata")

    for field, value in update_data.items():
        setattr(endpoint, field, value)

    db.commit()
    db.refresh(endpoint)
    return endpoint


@router.delete("/{uid}", status_code=204)
def delete_endpoint(uid: UUID, db: Session = Depends(get_db)):
    endpoint = db.query(Endpoint).filter(Endpoint.uid == uid).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    db.delete(endpoint)
    db.commit()
