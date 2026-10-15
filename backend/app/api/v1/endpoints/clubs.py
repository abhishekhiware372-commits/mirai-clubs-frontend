import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.entities import Club, ClubMembership, Campus, User
from app.schemas.schemas import ClubCreate, ClubUpdate, ClubOut, UserOut
from app.api.deps import get_current_user, require_coordinator_or_above, require_admin

router = APIRouter()

def slugify(text: str) -> str:
    text = text.lower().strip()
    return re.sub(r'[\s_]+', '-', re.sub(r'[^\w\s-]', '', text))

@router.get("/", response_model=List[ClubOut])
def list_clubs(
    campus_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Club).filter(Club.status != "ARCHIVED")
    if campus_id:
        query = query.filter(Club.campus_id == campus_id)
    if category and category.lower() != "all":
        cat_lower = category.lower()
        query = query.filter(func.lower(Club.category).like(f"%{cat_lower}%"))
    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(Club.name).like(search_fmt)) | 
            (func.lower(Club.description).like(search_fmt))
        )
    
    clubs = query.all()
    results = []
    for c in clubs:
        member_cnt = db.query(ClubMembership).filter(
            ClubMembership.club_id == c.id,
            ClubMembership.status == "APPROVED"
        ).count()
        advisor_name = c.advisor.full_name if c.advisor else None
        campus_name = c.campus.name if c.campus else None
        
        results.append(ClubOut(
            id=c.id,
            name=c.name,
            slug=c.slug,
            description=c.description,
            campus_id=c.campus_id,
            category=c.category,
            advisor_id=c.advisor_id,
            capacity=c.capacity,
            meeting_rules=c.meeting_rules,
            status=c.status,
            banner_url=c.banner_url,
            created_at=c.created_at,
            member_count=member_cnt,
            advisor_name=advisor_name,
            campus_name=campus_name
        ))
    return results

@router.get("/{id}", response_model=ClubOut)
def get_club(id: str, db: Session = Depends(get_db)):
    c = db.query(Club).filter(Club.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Club not found")
    
    member_cnt = db.query(ClubMembership).filter(
        ClubMembership.club_id == c.id,
        ClubMembership.status == "APPROVED"
    ).count()
    
    return ClubOut(
        id=c.id,
        name=c.name,
        slug=c.slug,
        description=c.description,
        campus_id=c.campus_id,
        category=c.category,
        advisor_id=c.advisor_id,
        capacity=c.capacity,
        meeting_rules=c.meeting_rules,
        status=c.status,
        banner_url=c.banner_url,
        created_at=c.created_at,
        member_count=member_cnt,
        advisor_name=c.advisor.full_name if c.advisor else None,
        campus_name=c.campus.name if c.campus else None
    )

@router.post("/", response_model=ClubOut)
def create_club(
    club_in: ClubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    if db.query(Club).count() >= 4:
        raise HTTPException(
            status_code=400,
            detail="MIRAI CLUBS platform is strictly restricted to exactly four official clubs: Nexcell, Khel Society, Kaizen, and Malhar."
        )

    existing = db.query(Club).filter(Club.name == club_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A club with this name already exists")
    
    slug_val = slugify(club_in.name)
    existing_slug = db.query(Club).filter(Club.slug == slug_val).first()
    if existing_slug:
        slug_val = f"{slug_val}-{db.query(Club).count() + 1}"

    club = Club(
        name=club_in.name,
        slug=slug_val,
        description=club_in.description,
        campus_id=club_in.campus_id,
        category=club_in.category,
        advisor_id=club_in.advisor_id or (current_user.id if current_user.role == "ADVISOR" else None),
        capacity=club_in.capacity,
        meeting_rules=club_in.meeting_rules,
        status="ACTIVE",
        banner_url=club_in.banner_url
    )
    db.add(club)
    db.commit()
    db.refresh(club)

    # If creator is a coordinator, auto-enroll as COORDINATOR
    if current_user.role == "COORDINATOR":
        mem = ClubMembership(
            user_id=current_user.id,
            club_id=club.id,
            role="COORDINATOR",
            status="APPROVED",
            is_primary=True,
            reviewed_by=current_user.id
        )
        db.add(mem)
        db.commit()

    return get_club(club.id, db)

@router.put("/{id}", response_model=ClubOut)
def update_club(
    id: str,
    club_in: ClubUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    club = db.query(Club).filter(Club.id == id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Check permissions: Coordinator must be member/coordinator of this club or Admin/Advisor
    if current_user.role == "COORDINATOR":
        mem = db.query(ClubMembership).filter(
            ClubMembership.club_id == id,
            ClubMembership.user_id == current_user.id,
            ClubMembership.role == "COORDINATOR",
            ClubMembership.status == "APPROVED"
        ).first()
        if not mem:
            raise HTTPException(status_code=403, detail="You can only edit clubs you coordinate")

    for field, val in club_in.dict(exclude_unset=True).items():
        setattr(club, field, val)

    db.commit()
    db.refresh(club)
    return get_club(club.id, db)

@router.get("/{id}/members", response_model=List[UserOut])
def list_club_members(id: str, db: Session = Depends(get_db)):
    memberships = db.query(ClubMembership).filter(
        ClubMembership.club_id == id,
        ClubMembership.status == "APPROVED"
    ).all()
    user_ids = [m.user_id for m in memberships]
    return db.query(User).filter(User.id.in_(user_ids)).all()
