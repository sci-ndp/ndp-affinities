from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dataset_endpoint import DatasetEndpoint
from app.schemas.dataset_endpoint import DatasetEndpointCreate, DatasetEndpointResponse

router = APIRouter(prefix="/dataset-endpoints", tags=["dataset-endpoints"])


@router.get("", response_model=list[DatasetEndpointResponse])
def list_dataset_endpoints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(DatasetEndpoint).offset(skip).limit(limit).all()


@router.get("/{dataset_uid}/{endpoint_uid}", response_model=DatasetEndpointResponse)
def get_dataset_endpoint(dataset_uid: UUID, endpoint_uid: UUID, db: Session = Depends(get_db)):
    item = db.query(DatasetEndpoint).filter(
        DatasetEndpoint.dataset_uid == dataset_uid,
        DatasetEndpoint.endpoint_uid == endpoint_uid
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="DatasetEndpoint not found")
    return item


@router.post("", response_model=DatasetEndpointResponse, status_code=201)
def create_dataset_endpoint(data: DatasetEndpointCreate, db: Session = Depends(get_db)):
    item = DatasetEndpoint(
        dataset_uid=data.dataset_uid,
        endpoint_uid=data.endpoint_uid,
        role=data.role,
        attrs=data.attrs,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{dataset_uid}/{endpoint_uid}", status_code=204)
def delete_dataset_endpoint(dataset_uid: UUID, endpoint_uid: UUID, db: Session = Depends(get_db)):
    item = db.query(DatasetEndpoint).filter(
        DatasetEndpoint.dataset_uid == dataset_uid,
        DatasetEndpoint.endpoint_uid == endpoint_uid
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="DatasetEndpoint not found")
    db.delete(item)
    db.commit()
