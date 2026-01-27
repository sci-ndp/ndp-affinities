from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceResponse])
def list_services(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Service).offset(skip).limit(limit).all()


@router.get("/{uid}", response_model=ServiceResponse)
def get_service(uid: UUID, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.uid == uid).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.post("", response_model=ServiceResponse, status_code=201)
def create_service(data: ServiceCreate, db: Session = Depends(get_db)):
    service = Service(
        type=data.type,
        openapi_url=data.openapi_url,
        version=data.version,
        source_ep=data.source_ep,
        metadata_=data.metadata,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{uid}", response_model=ServiceResponse)
def update_service(uid: UUID, data: ServiceUpdate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.uid == uid).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = data.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        update_data["metadata_"] = update_data.pop("metadata")

    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service


@router.delete("/{uid}", status_code=204)
def delete_service(uid: UUID, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.uid == uid).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
