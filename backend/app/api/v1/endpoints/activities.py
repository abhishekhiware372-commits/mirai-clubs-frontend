from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Activity, ActivityApproval, Club, ClubMembership, User, Notification
from app.schemas.schemas import ActivityCreate, ActivityOut, ActivityApprovalAction
from app.api.deps import get_current_user, require_coordinator_or_above, require_advisor_or_above

router = APIRouter()

@router.get("/", response_model=List[ActivityOut])
def list_activities(
    club_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Activity)
    if club_id:
        query = query.filter(Activity.club_id == club_id)
    if status_filter:
        query = query.filter(Activity.status == status_filter)
    else:
        # If student, only show APPROVED or COMPLETED activities unless they are coordinator
        if current_user.role == "STUDENT":
            query = query.filter(Activity.status.in_(["APPROVED", "COMPLETED"]))

    activities = query.order_by(Activity.start_time.asc()).all()
    results = []
    for a in activities:
        results.append(ActivityOut(
            id=a.id,
            club_id=a.club_id,
            topic=a.topic,
            description=a.description,
            format=a.format,
            deliverable=a.deliverable,
            venue=a.venue,
            start_time=a.start_time,
            end_time=a.end_time,
            submission_deadline=a.submission_deadline,
            advisor_id=a.advisor_id,
            capacity=a.capacity,
            status=a.status,
            created_by=a.created_by,
            created_at=a.created_at,
            club_name=a.club.name if a.club else None,
            advisor_name=a.advisor.full_name if a.advisor else None,
            attendee_count=len(a.attendances)
        ))
    return results

@router.get("/{id}", response_model=ActivityOut)
def get_activity(id: str, db: Session = Depends(get_db)):
    a = db.query(Activity).filter(Activity.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Activity not found")
    return ActivityOut(
        id=a.id,
        club_id=a.club_id,
        topic=a.topic,
        description=a.description,
        format=a.format,
        deliverable=a.deliverable,
        venue=a.venue,
        start_time=a.start_time,
        end_time=a.end_time,
        submission_deadline=a.submission_deadline,
        advisor_id=a.advisor_id,
        capacity=a.capacity,
        status=a.status,
        created_by=a.created_by,
        created_at=a.created_at,
        club_name=a.club.name if a.club else None,
        advisor_name=a.advisor.full_name if a.advisor else None,
        attendee_count=len(a.attendances)
    )

@router.post("/", response_model=ActivityOut)
def create_activity(
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    club = db.query(Club).filter(Club.id == activity_in.club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    # If coordinator, check that they belong to this club
    if current_user.role == "COORDINATOR":
        mem = db.query(ClubMembership).filter(
            ClubMembership.club_id == activity_in.club_id,
            ClubMembership.user_id == current_user.id,
            ClubMembership.role == "COORDINATOR",
            ClubMembership.status == "APPROVED"
        ).first()
        if not mem:
            raise HTTPException(status_code=403, detail="You can only create activities for clubs you coordinate")

    if activity_in.end_time <= activity_in.start_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    activity = Activity(
        club_id=activity_in.club_id,
        topic=activity_in.topic,
        description=activity_in.description,
        format=activity_in.format,
        deliverable=activity_in.deliverable,
        venue=activity_in.venue,
        start_time=activity_in.start_time,
        end_time=activity_in.end_time,
        submission_deadline=activity_in.submission_deadline,
        advisor_id=club.advisor_id,
        capacity=activity_in.capacity,
        status="DRAFT",
        created_by=current_user.id
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    return get_activity(activity.id, db)

@router.post("/{id}/submit", response_model=ActivityOut)
def submit_activity_for_approval(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    activity = db.query(Activity).filter(Activity.id == id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.status = "SUBMITTED"
    db.commit()
    db.refresh(activity)

    # Notify advisor if assigned
    if activity.advisor_id:
        notif = Notification(
            user_id=activity.advisor_id,
            title="Activity Plan Awaiting Approval",
            message=f"Club Day activity '{activity.topic}' for club '{activity.club.name}' is submitted for your approval.",
            notification_type="APPROVAL"
        )
        db.add(notif)
        db.commit()

    return get_activity(activity.id, db)

@router.post("/{id}/approve", response_model=ActivityOut)
def review_activity(
    id: str,
    approval_in: ActivityApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_advisor_or_above)
):
    activity = db.query(Activity).filter(Activity.id == id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # If advisor, ensure advisor is assigned to this club or is Admin
    if current_user.role == "ADVISOR" and activity.advisor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only approve activities for your assigned clubs")

    if approval_in.status not in ["APPROVED", "REJECTED", "CHANGES_REQUESTED"]:
        raise HTTPException(status_code=400, detail="Invalid approval action")

    activity.status = approval_in.status

    # Record approval trail
    approval_record = ActivityApproval(
        activity_id=activity.id,
        advisor_id=current_user.id,
        status=approval_in.status,
        comments=approval_in.comments
    )
    db.add(approval_record)
    db.commit()
    db.refresh(activity)

    # Notify creator / coordinator
    notif = Notification(
        user_id=activity.created_by,
        title=f"Activity Plan {approval_in.status}",
        message=f"Your activity '{activity.topic}' was {approval_in.status.lower()} by Advisor {current_user.full_name}. Comments: {approval_in.comments or 'None'}",
        notification_type="APPROVAL"
    )
    db.add(notif)
    db.commit()

    return get_activity(activity.id, db)
