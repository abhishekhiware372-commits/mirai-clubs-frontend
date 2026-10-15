from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import ClubMembership, Club, User, Notification
from app.schemas.schemas import MembershipRequest, MembershipReview, MembershipOut
from app.api.deps import get_current_user, require_coordinator_or_above

router = APIRouter()

MAX_MEMBERSHIPS_PER_STUDENT = 2  # 1 Primary, 1 Secondary

@router.post("/request", response_model=MembershipOut)
def request_membership(
    req: MembershipRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    club = db.query(Club).filter(Club.id == req.club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if club.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Cannot join an inactive or archived club")

    # Check student active memberships count
    existing_memberships = db.query(ClubMembership).filter(
        ClubMembership.user_id == current_user.id,
        ClubMembership.status.in_(["PENDING", "APPROVED"])
    ).all()

    # Duplicate check
    for m in existing_memberships:
        if m.club_id == req.club_id:
            if m.status == "PENDING":
                raise HTTPException(status_code=400, detail="You already have a pending join request for this club")
            elif m.status == "APPROVED":
                raise HTTPException(status_code=400, detail="You are already an approved member of this club")

    # Limit check
    if len(existing_memberships) >= MAX_MEMBERSHIPS_PER_STUDENT:
        raise HTTPException(
            status_code=400, 
            detail=f"Membership limit reached ({MAX_MEMBERSHIPS_PER_STUDENT} active clubs maximum per student)"
        )

    # Capacity check
    current_members_count = db.query(ClubMembership).filter(
        ClubMembership.club_id == req.club_id,
        ClubMembership.status == "APPROVED"
    ).count()
    if current_members_count >= club.capacity:
        raise HTTPException(status_code=400, detail="This club has reached its maximum member capacity")

    membership = ClubMembership(
        user_id=current_user.id,
        club_id=req.club_id,
        role="MEMBER",
        status="PENDING",
        is_primary=req.is_primary,
        requested_at=datetime.utcnow()
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    # Notify student
    notif = Notification(
        user_id=current_user.id,
        title="Membership Request Submitted",
        message=f"Your membership request for '{club.name}' has been submitted for coordinator review.",
        notification_type="INFO"
    )
    db.add(notif)
    db.commit()

    return MembershipOut(
        id=membership.id,
        user_id=membership.user_id,
        club_id=membership.club_id,
        role=membership.role,
        status=membership.status,
        is_primary=membership.is_primary,
        requested_at=membership.requested_at,
        reviewed_at=membership.reviewed_at,
        rejection_reason=membership.rejection_reason,
        user_name=current_user.full_name,
        user_email=current_user.email,
        student_id=current_user.student_id,
        club_name=club.name
    )

@router.get("/my", response_model=List[MembershipOut])
def list_my_memberships(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memberships = db.query(ClubMembership).filter(ClubMembership.user_id == current_user.id).all()
    results = []
    for m in memberships:
        results.append(MembershipOut(
            id=m.id,
            user_id=m.user_id,
            club_id=m.club_id,
            role=m.role,
            status=m.status,
            is_primary=m.is_primary,
            requested_at=m.requested_at,
            reviewed_at=m.reviewed_at,
            rejection_reason=m.rejection_reason,
            user_name=current_user.full_name,
            user_email=current_user.email,
            student_id=current_user.student_id,
            club_name=m.club.name if m.club else None
        ))
    return results

@router.get("/pending", response_model=List[MembershipOut])
def list_pending_memberships(
    club_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    query = db.query(ClubMembership).filter(ClubMembership.status == "PENDING")
    
    # If coordinator, filter by clubs they manage
    if current_user.role == "COORDINATOR":
        managed_club_ids = [
            m.club_id for m in db.query(ClubMembership).filter(
                ClubMembership.user_id == current_user.id,
                ClubMembership.role == "COORDINATOR",
                ClubMembership.status == "APPROVED"
            ).all()
        ]
        if not managed_club_ids:
            return []
        query = query.filter(ClubMembership.club_id.in_(managed_club_ids))
    elif club_id:
        query = query.filter(ClubMembership.club_id == club_id)

    pending_list = query.all()
    results = []
    for m in pending_list:
        results.append(MembershipOut(
            id=m.id,
            user_id=m.user_id,
            club_id=m.club_id,
            role=m.role,
            status=m.status,
            is_primary=m.is_primary,
            requested_at=m.requested_at,
            reviewed_at=m.reviewed_at,
            rejection_reason=m.rejection_reason,
            user_name=m.user.full_name if m.user else None,
            user_email=m.user.email if m.user else None,
            student_id=m.user.student_id if m.user else None,
            club_name=m.club.name if m.club else None
        ))
    return results

@router.post("/{id}/review", response_model=MembershipOut)
def review_membership(
    id: str,
    review: MembershipReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    mem = db.query(ClubMembership).filter(ClubMembership.id == id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Membership request not found")

    club = db.query(Club).filter(Club.id == mem.club_id).first()
    
    # Permission verification
    if current_user.role == "COORDINATOR":
        coord_mem = db.query(ClubMembership).filter(
            ClubMembership.club_id == mem.club_id,
            ClubMembership.user_id == current_user.id,
            ClubMembership.role == "COORDINATOR",
            ClubMembership.status == "APPROVED"
        ).first()
        if not coord_mem:
            raise HTTPException(status_code=403, detail="You can only approve requests for clubs you coordinate")

    if review.status == "APPROVED":
        # Check capacity at the moment of approval
        current_count = db.query(ClubMembership).filter(
            ClubMembership.club_id == mem.club_id,
            ClubMembership.status == "APPROVED"
        ).count()
        if current_count >= club.capacity:
            raise HTTPException(status_code=400, detail="Cannot approve: Club capacity has been reached")
        
        mem.status = "APPROVED"
        notif_msg = f"Congratulations! Your membership request for '{club.name}' has been approved."
    elif review.status == "REJECTED":
        mem.status = "REJECTED"
        mem.rejection_reason = review.rejection_reason or "Requirements not met"
        notif_msg = f"Your membership request for '{club.name}' was declined. Reason: {mem.rejection_reason}"
    else:
        raise HTTPException(status_code=400, detail="Invalid review status")

    mem.reviewed_by = current_user.id
    mem.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(mem)

    # Notify student
    student_notif = Notification(
        user_id=mem.user_id,
        title=f"Membership {mem.status}",
        message=notif_msg,
        notification_type="APPROVAL"
    )
    db.add(student_notif)
    db.commit()

    return MembershipOut(
        id=mem.id,
        user_id=mem.user_id,
        club_id=mem.club_id,
        role=mem.role,
        status=mem.status,
        is_primary=mem.is_primary,
        requested_at=mem.requested_at,
        reviewed_at=mem.reviewed_at,
        rejection_reason=mem.rejection_reason,
        user_name=mem.user.full_name if mem.user else None,
        user_email=mem.user.email if mem.user else None,
        student_id=mem.user.student_id if mem.user else None,
        club_name=club.name
    )
