import time
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import (
    Activity, QRSession, Attendance, AttendanceCorrection, User, AuditLog, Notification
)
from app.schemas.schemas import (
    QRSessionCreate, QRTokenCheckIn, AttendanceCorrectionRequest, PresenterUpdateRequest, AttendanceOut
)
from app.api.deps import get_current_user, require_coordinator_or_above
from app.services.qr_service import (
    generate_session_secret, generate_qr_token, validate_qr_token,
    generate_qr_code_base64, get_time_step, ROTATION_SECONDS
)

router = APIRouter()

@router.post("/session/create")
def create_qr_session(
    session_in: QRSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    activity = db.query(Activity).filter(Activity.id == session_in.activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Deactivate existing sessions
    existing_sessions = db.query(QRSession).filter(
        QRSession.activity_id == activity.id,
        QRSession.is_active == True
    ).all()
    for s in existing_sessions:
        s.is_active = False

    secret = generate_session_secret()
    now = datetime.utcnow()
    valid_until = now + timedelta(minutes=session_in.duration_minutes)

    session = QRSession(
        activity_id=activity.id,
        created_by=current_user.id,
        secret_key=secret,
        valid_from=now,
        valid_until=valid_until,
        rotation_interval_seconds=session_in.rotation_seconds,
        is_active=True
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "activity_id": activity.id,
        "valid_until": session.valid_until.isoformat(),
        "rotation_interval_seconds": session.rotation_interval_seconds
    }

@router.get("/session/{activity_id}/current-qr")
def get_current_qr(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    now = datetime.utcnow()
    session = db.query(QRSession).filter(
        QRSession.activity_id == activity_id,
        QRSession.is_active == True,
        QRSession.valid_until >= now
    ).order_by(QRSession.created_at.desc()).first()

    if not session:
        raise HTTPException(status_code=404, detail="No active attendance QR session for this activity")

    step = get_time_step()
    token = generate_qr_token(session.secret_key, step)
    
    # Calculate seconds remaining in current 15s window
    current_time_sec = time.time()
    seconds_remaining = int(ROTATION_SECONDS - (current_time_sec % ROTATION_SECONDS))

    qr_image_data = generate_qr_code_base64(token)

    return {
        "session_id": session.id,
        "activity_id": activity_id,
        "token": token,
        "qr_code_data": qr_image_data,
        "seconds_remaining": seconds_remaining,
        "expires_in_window": ROTATION_SECONDS
    }

@router.post("/check-in")
def check_in(
    check_in_data: QRTokenCheckIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    # Find active session
    session = db.query(QRSession).filter(
        QRSession.activity_id == check_in_data.activity_id,
        QRSession.is_active == True
    ).order_by(QRSession.created_at.desc()).first()

    if not session:
        raise HTTPException(status_code=400, detail="Attendance check-in is not currently open for this activity")

    if now > session.valid_until:
        raise HTTPException(status_code=400, detail="EXPIRED_QR: Attendance session window has closed")

    # Validate rotating token
    is_valid = validate_qr_token(session.secret_key, check_in_data.token)
    if not is_valid:
        raise HTTPException(status_code=400, detail="INVALID_QR: QR code expired or invalid. Please scan the current code.")

    # Duplicate check-in verification
    existing_attendance = db.query(Attendance).filter(
        Attendance.activity_id == check_in_data.activity_id,
        Attendance.user_id == current_user.id
    ).first()

    if existing_attendance:
        return {
            "status": "ALREADY_CHECKED_IN",
            "message": "You have already checked in for this session.",
            "checked_in_at": existing_attendance.checked_in_at.isoformat()
        }

    # Determine if late check-in
    activity = db.query(Activity).filter(Activity.id == check_in_data.activity_id).first()
    is_late = False
    if activity and activity.start_time:
        # If check-in is more than 15 minutes past start_time
        if now > (activity.start_time + timedelta(minutes=15)):
            is_late = True

    attendance_status = "LATE" if is_late else "PRESENT"
    attendance = Attendance(
        activity_id=check_in_data.activity_id,
        user_id=current_user.id,
        qr_session_id=session.id,
        checked_in_at=now,
        is_late=is_late,
        status=attendance_status,
        method="QR_SCAN"
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    result_code = "LATE_CHECK_IN" if is_late else "SUCCESS"
    return {
        "status": result_code,
        "message": f"Check-in verified successfully ({'Late' if is_late else 'On time'})!",
        "attendance_id": attendance.id,
        "checked_in_at": attendance.checked_in_at.isoformat(),
        "is_late": is_late
    }

@router.get("/activity/{activity_id}", response_model=List[AttendanceOut])
def list_activity_attendance(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    records = db.query(Attendance).filter(Attendance.activity_id == activity_id).all()
    results = []
    for r in records:
        results.append(AttendanceOut(
            id=r.id,
            activity_id=r.activity_id,
            user_id=r.user_id,
            checked_in_at=r.checked_in_at,
            is_late=r.is_late,
            status=r.status,
            method=r.method,
            is_presenter=bool(getattr(r, "is_presenter", False)),
            on_the_spot_result=getattr(r, "on_the_spot_result", None),
            user_name=r.user.full_name if r.user else None,
            student_id=r.user.student_id if r.user else None,
            activity_topic=r.activity.topic if r.activity else None
        ))
    return results

@router.post("/correct/{attendance_id}")
def correct_attendance(
    attendance_id: str,
    correction_in: AttendanceCorrectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    original_status = attendance.status
    attendance.status = correction_in.corrected_status
    attendance.method = "MANUAL_CORRECTION"

    # Save audit record
    correction = AttendanceCorrection(
        attendance_id=attendance.id,
        original_status=original_status,
        corrected_status=correction_in.corrected_status,
        reason=correction_in.reason,
        corrected_by=current_user.id
    )
    db.add(correction)

    # General audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="ATTENDANCE_CORRECTION",
        entity_type="Attendance",
        entity_id=attendance.id,
        details={
            "original_status": original_status,
            "corrected_status": correction_in.corrected_status,
            "reason": correction_in.reason,
            "student_id": attendance.user.student_id if attendance.user else None
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(attendance)

    return {
        "success": True,
        "attendance_id": attendance.id,
        "original_status": original_status,
        "new_status": attendance.status,
        "corrected_by": current_user.full_name
    }

@router.post("/presenter/{attendance_id}")
def mark_presenter(
    attendance_id: str,
    presenter_in: PresenterUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    attendance.is_presenter = presenter_in.is_presenter
    if presenter_in.on_the_spot_result is not None:
        attendance.on_the_spot_result = presenter_in.on_the_spot_result

    audit = AuditLog(
        user_id=current_user.id,
        action="PRESENTER_RECORD",
        entity_type="Attendance",
        entity_id=attendance.id,
        details={
            "is_presenter": presenter_in.is_presenter,
            "on_the_spot_result": presenter_in.on_the_spot_result,
            "student_id": attendance.user.student_id if attendance.user else None
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(attendance)

    return {
        "success": True,
        "attendance_id": attendance.id,
        "is_presenter": attendance.is_presenter,
        "on_the_spot_result": attendance.on_the_spot_result
    }
