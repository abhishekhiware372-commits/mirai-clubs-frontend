from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.entities import (
    Event, EventRegistration, EventTeam, EventTeamMember, User, Notification
)
from app.schemas.schemas import EventCreate, EventOut, TeamCreate, EventRegistrationOut
from app.api.deps import get_current_user, require_coordinator_or_above

router = APIRouter()

@router.get("/", response_model=List[EventOut])
def list_events(
    campus_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if campus_id:
        query = query.filter((Event.campus_id == campus_id) | (Event.campus_id == None))
    if category and category.lower() != "all":
        query = query.filter(Event.category == category)
    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(Event.title).like(search_fmt)) |
            (func.lower(Event.description).like(search_fmt))
        )
    
    events = query.order_by(Event.start_time.asc()).all()
    results = []
    for ev in events:
        reg_count = db.query(EventRegistration).filter(
            EventRegistration.event_id == ev.id,
            EventRegistration.status == "CONFIRMED"
        ).count()
        results.append(EventOut(
            id=ev.id,
            title=ev.title,
            description=ev.description,
            campus_id=ev.campus_id,
            category=ev.category,
            event_type=ev.event_type,
            venue=ev.venue,
            start_time=ev.start_time,
            end_time=ev.end_time,
            registration_deadline=ev.registration_deadline,
            max_participants=ev.max_participants,
            team_size_min=ev.team_size_min,
            team_size_max=ev.team_size_max,
            prize_pool=ev.prize_pool,
            status=ev.status,
            created_at=ev.created_at,
            registration_count=reg_count
        ))
    return results

@router.get("/{id}", response_model=EventOut)
def get_event(id: str, db: Session = Depends(get_db)):
    ev = db.query(Event).filter(Event.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    reg_count = db.query(EventRegistration).filter(
        EventRegistration.event_id == ev.id,
        EventRegistration.status == "CONFIRMED"
    ).count()
    return EventOut(
        id=ev.id,
        title=ev.title,
        description=ev.description,
        campus_id=ev.campus_id,
        category=ev.category,
        event_type=ev.event_type,
        venue=ev.venue,
        start_time=ev.start_time,
        end_time=ev.end_time,
        registration_deadline=ev.registration_deadline,
        max_participants=ev.max_participants,
        team_size_min=ev.team_size_min,
        team_size_max=ev.team_size_max,
        prize_pool=ev.prize_pool,
        status=ev.status,
        created_at=ev.created_at,
        registration_count=reg_count
    )

@router.post("/", response_model=EventOut)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    ev = Event(
        title=event_in.title,
        description=event_in.description,
        campus_id=event_in.campus_id,
        category=event_in.category,
        event_type=event_in.event_type,
        venue=event_in.venue,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        registration_deadline=event_in.registration_deadline,
        max_participants=event_in.max_participants,
        team_size_min=event_in.team_size_min,
        team_size_max=event_in.team_size_max,
        prize_pool=event_in.prize_pool,
        status="UPCOMING"
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return get_event(ev.id, db)

@router.post("/{id}/register", response_model=EventRegistrationOut)
def register_for_event(
    id: str,
    team_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Event).filter(Event.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    # Deadline check
    now = datetime.utcnow()
    if now > ev.registration_deadline:
        raise HTTPException(status_code=400, detail="Event registration deadline has passed")

    # Duplicate check
    existing = db.query(EventRegistration).filter(
        EventRegistration.event_id == id,
        EventRegistration.user_id == current_user.id,
        EventRegistration.status == "CONFIRMED"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You are already registered for this event")

    # Capacity check
    reg_count = db.query(EventRegistration).filter(
        EventRegistration.event_id == id,
        EventRegistration.status == "CONFIRMED"
    ).count()
    if reg_count >= ev.max_participants:
        raise HTTPException(status_code=400, detail="Event has reached maximum capacity")

    # Verify team if provided
    team = None
    if team_id:
        team = db.query(EventTeam).filter(EventTeam.id == team_id, EventTeam.event_id == id).first()
        if not team:
            raise HTTPException(status_code=400, detail="Specified team does not exist for this event")

    registration = EventRegistration(
        event_id=id,
        user_id=current_user.id,
        team_id=team_id,
        registered_at=now,
        status="CONFIRMED"
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)

    # Notify student
    notif = Notification(
        user_id=current_user.id,
        title="Event Registration Confirmed",
        message=f"You are registered for '{ev.title}' scheduled at {ev.venue}.",
        notification_type="INFO"
    )
    db.add(notif)
    db.commit()

    return EventRegistrationOut(
        id=registration.id,
        event_id=registration.event_id,
        user_id=registration.user_id,
        team_id=registration.team_id,
        team_name=team.name if team else None,
        registered_at=registration.registered_at,
        checked_in=registration.checked_in,
        status=registration.status,
        user_name=current_user.full_name
    )

@router.post("/{id}/teams")
def create_event_team(
    id: str,
    team_in: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = db.query(Event).filter(Event.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    team = EventTeam(
        event_id=id,
        name=team_in.name,
        leader_id=current_user.id,
        status="ACTIVE"
    )
    db.add(team)
    db.flush()

    # Add leader as first member
    leader_member = EventTeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role="LEADER"
    )
    db.add(leader_member)

    # Register leader for event with this team
    existing_reg = db.query(EventRegistration).filter(
        EventRegistration.event_id == id,
        EventRegistration.user_id == current_user.id
    ).first()
    if existing_reg:
        existing_reg.team_id = team.id
        existing_reg.status = "CONFIRMED"
    else:
        reg = EventRegistration(
            event_id=id,
            user_id=current_user.id,
            team_id=team.id,
            registered_at=datetime.utcnow(),
            status="CONFIRMED"
        )
        db.add(reg)

    # Add other members by email if found
    for email in team_in.member_emails or []:
        member_user = db.query(User).filter(User.email == email.lower()).first()
        if member_user and member_user.id != current_user.id:
            m_record = EventTeamMember(
                team_id=team.id,
                user_id=member_user.id,
                role="MEMBER"
            )
            db.add(m_record)
            # Register member
            m_reg = EventRegistration(
                event_id=id,
                user_id=member_user.id,
                team_id=team.id,
                registered_at=datetime.utcnow(),
                status="CONFIRMED"
            )
            db.add(m_reg)

    db.commit()
    return {"team_id": team.id, "team_name": team.name, "leader": current_user.full_name}

@router.post("/{id}/check-in/{registration_id}")
def check_in_event(
    id: str,
    registration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    reg = db.query(EventRegistration).filter(
        EventRegistration.id == registration_id,
        EventRegistration.event_id == id
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    reg.checked_in = True
    reg.checked_in_at = datetime.utcnow()
    db.commit()
    return {"success": True, "checked_in": True, "user_id": reg.user_id}
