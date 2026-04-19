from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models.schemas import CaseCreate, CaseOut
from database import get_db, Case

router = APIRouter()

@router.post("/", response_model=CaseOut)
def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    new_case = Case(**case.model_dump())
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

@router.get("/", response_model=List[CaseOut])
def get_all_cases(db: Session = Depends(get_db)):
    return db.query(Case).order_by(Case.created_at.desc()).all()

@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.delete("/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
    return {"message": "Case deleted"}