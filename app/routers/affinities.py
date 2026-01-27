from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.affinity_triple import AffinityTriple
from app.schemas.affinity_triple import AffinityTripleCreate, AffinityTripleUpdate, AffinityTripleResponse

router = APIRouter(prefix="/affinities", tags=["affinities"])


@router.get("", response_model=list[AffinityTripleResponse])
def list_affinities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(AffinityTriple).offset(skip).limit(limit).all()


@router.get("/{triple_uid}", response_model=AffinityTripleResponse)
def get_affinity(triple_uid: UUID, db: Session = Depends(get_db)):
    item = db.query(AffinityTriple).filter(AffinityTriple.triple_uid == triple_uid).first()
    if not item:
        raise HTTPException(status_code=404, detail="AffinityTriple not found")
    return item


@router.post("", response_model=AffinityTripleResponse, status_code=201)
def create_affinity(data: AffinityTripleCreate, db: Session = Depends(get_db)):
    item = AffinityTriple(
        dataset_uid=data.dataset_uid,
        endpoint_uids=data.endpoint_uids,
        service_uids=data.service_uids,
        attrs=data.attrs,
        version=data.version,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{triple_uid}", response_model=AffinityTripleResponse)
def update_affinity(triple_uid: UUID, data: AffinityTripleUpdate, db: Session = Depends(get_db)):
    item = db.query(AffinityTriple).filter(AffinityTriple.triple_uid == triple_uid).first()
    if not item:
        raise HTTPException(status_code=404, detail="AffinityTriple not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{triple_uid}", status_code=204)
def delete_affinity(triple_uid: UUID, db: Session = Depends(get_db)):
    item = db.query(AffinityTriple).filter(AffinityTriple.triple_uid == triple_uid).first()
    if not item:
        raise HTTPException(status_code=404, detail="AffinityTriple not found")
    db.delete(item)
    db.commit()
