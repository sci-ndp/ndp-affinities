from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetCreate, DatasetUpdate, DatasetResponse

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("", response_model=list[DatasetResponse])
def list_datasets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Dataset).offset(skip).limit(limit).all()


@router.get("/{uid}", response_model=DatasetResponse)
def get_dataset(uid: UUID, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.uid == uid).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.post("", response_model=DatasetResponse, status_code=201)
def create_dataset(data: DatasetCreate, db: Session = Depends(get_db)):
    dataset = Dataset(
        title=data.title,
        source_ep=data.source_ep,
        metadata_=data.metadata,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.put("/{uid}", response_model=DatasetResponse)
def update_dataset(uid: UUID, data: DatasetUpdate, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.uid == uid).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    update_data = data.model_dump(exclude_unset=True)
    if "metadata" in update_data:
        update_data["metadata_"] = update_data.pop("metadata")

    for field, value in update_data.items():
        setattr(dataset, field, value)

    db.commit()
    db.refresh(dataset)
    return dataset


@router.delete("/{uid}", status_code=204)
def delete_dataset(uid: UUID, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.uid == uid).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    db.delete(dataset)
    db.commit()
