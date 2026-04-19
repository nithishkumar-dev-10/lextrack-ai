from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models.schemas import HearingCreate, HearingOut
from database import get_db, Hearing

router = APIRouter()

@router.post("/", response_model=HearingOut)
def create_hearing(hearing: HearingCreate, db: Session = Depends(get_db)):
    new_hearing = Hearing(**hearing.model_dump())
    db.add(new_hearing)
    db.commit()
    db.refresh(new_hearing)
    return new_hearing

@router.get("/", response_model=List[HearingOut])
def get_all_hearings(db: Session = Depends(get_db)):
    return db.query(Hearing).order_by(Hearing.hearing_date).all()

@router.get("/{hearing_id}", response_model=HearingOut)
def get_hearing(hearing_id: int, db: Session = Depends(get_db)):
    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    return hearing

@router.delete("/{hearing_id}")
def delete_hearing(hearing_id: int, db: Session = Depends(get_db)):
    hearing = db.query(Hearing).filter(Hearing.id == hearing_id).first()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    db.delete(hearing)
    db.commit()
    return {"message": "Hearing deleted"}