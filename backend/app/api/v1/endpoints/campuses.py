from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Campus, User
from app.schemas.schemas import CampusCreate, CampusOut
from app.api.deps import get_current_user, require_admin

router = APIRouter()

@router.get("/", response_model=List[CampusOut])
def list_campuses(db: Session = Depends(get_db)):
    return db.query(Campus).all()

@router.post("/", response_model=CampusOut)
def create_campus(
    campus_in: CampusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = db.query(Campus).filter(Campus.code == campus_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Campus code already exists")
    
    campus = Campus(
        name=campus_in.name,
        code=campus_in.code,
        location=campus_in.location
    )
    db.add(campus)
    db.commit()
    db.refresh(campus)
    return campus
