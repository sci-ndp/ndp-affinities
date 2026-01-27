from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dataset_service import DatasetService
from app.schemas.dataset_service import DatasetServiceCreate, DatasetServiceResponse

router = APIRouter(prefix="/dataset-services", tags=["dataset-services"])


@router.get("", response_model=list[DatasetServiceResponse])
def list_dataset_services(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DatasetService).offset(skip).limit(limit).all()


@router.get("/{dataset_uid}/{service_uid}", response_model=DatasetServiceResponse)
def get_dataset_service(dataset_uid: UUID, service_uid: UUID, db: Session = Depends(get_db)):
    item = db.query(DatasetService).filter(
        DatasetService.dataset_uid == dataset_uid,
        DatasetService.service_uid == service_uid
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="DatasetService not found")
    return item


@router.post("", response_model=DatasetServiceResponse, status_code=201)
def create_dataset_service(data: DatasetServiceCreate, db: Session = Depends(get_db)):
    item = DatasetService(
        dataset_uid=data.dataset_uid,
        service_uid=data.service_uid,
        role=data.role,
        attrs=data.attrs,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{dataset_uid}/{service_uid}", status_code=204)
def delete_dataset_service(dataset_uid: UUID, service_uid: UUID, db: Session = Depends(get_db)):
    item = db.query(DatasetService).filter(
        DatasetService.dataset_uid == dataset_uid,
        DatasetService.service_uid == service_uid
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="DatasetService not found")
    db.delete(item)
    db.commit()
