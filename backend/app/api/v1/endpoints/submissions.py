import os
import uuid
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.entities import Submission, Activity, ClubMembership, User
from app.schemas.schemas import SubmissionOut
from app.api.deps import get_current_user, require_coordinator_or_above

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".ppt", ".pptx", ".zip", ".png", ".jpg", ".jpeg", ".docx"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

@router.post("/upload", response_model=SubmissionOut)
async def upload_submission(
    activity_id: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    external_link: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Enforce deadline
    now = datetime.utcnow()
    if activity.submission_deadline and now > activity.submission_deadline:
        raise HTTPException(status_code=400, detail="Submission deadline has passed for this activity")

    file_path = None
    file_name = None
    file_size = None
    file_type = None

    if file and file.filename:
        # Validate extension
        _, ext = os.path.splitext(file.filename)
        ext = ext.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        os.makedirs(settings.STORAGE_DIR, exist_ok=True)
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        dest_path = os.path.join(settings.STORAGE_DIR, unique_filename)

        # Write file and measure size
        bytes_written = 0
        with open(dest_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                bytes_written += len(chunk)
                if bytes_written > MAX_FILE_SIZE:
                    buffer.close()
                    os.remove(dest_path)
                    raise HTTPException(status_code=400, detail="File size exceeds maximum permitted 25MB limit")
                buffer.write(chunk)

        file_path = dest_path
        file_name = file.filename
        file_size = bytes_written
        file_type = file.content_type or ext
    elif not external_link:
        raise HTTPException(status_code=400, detail="Either a deliverable file or an external link must be provided")

    # Check for existing submission for update
    existing = db.query(Submission).filter(
        Submission.activity_id == activity_id,
        Submission.user_id == current_user.id
    ).first()

    if existing:
        existing.title = title
        existing.description = description
        if file_path:
            existing.file_path = file_path
            existing.file_name = file_name
            existing.file_size = file_size
            existing.file_type = file_type
        if external_link:
            existing.external_link = external_link
        existing.submitted_at = now
        existing.status = "SUBMITTED"
        db.commit()
        db.refresh(existing)
        sub = existing
    else:
        sub = Submission(
            activity_id=activity_id,
            user_id=current_user.id,
            title=title,
            description=description,
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            file_type=file_type,
            external_link=external_link,
            submitted_at=now,
            status="SUBMITTED"
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

    return SubmissionOut(
        id=sub.id,
        activity_id=sub.activity_id,
        user_id=sub.user_id,
        title=sub.title,
        description=sub.description,
        file_path=sub.file_path,
        file_name=sub.file_name,
        file_size=sub.file_size,
        file_type=sub.file_type,
        external_link=sub.external_link,
        submitted_at=sub.submitted_at,
        status=sub.status,
        user_name=current_user.full_name,
        student_id=current_user.student_id,
        activity_topic=activity.topic
    )

@router.get("/my", response_model=List[SubmissionOut])
def list_my_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    submissions = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    results = []
    for s in submissions:
        results.append(SubmissionOut(
            id=s.id,
            activity_id=s.activity_id,
            user_id=s.user_id,
            title=s.title,
            description=s.description,
            file_path=s.file_path,
            file_name=s.file_name,
            file_size=s.file_size,
            file_type=s.file_type,
            external_link=s.external_link,
            submitted_at=s.submitted_at,
            status=s.status,
            user_name=current_user.full_name,
            student_id=current_user.student_id,
            activity_topic=s.activity.topic if s.activity else None
        ))
    return results

@router.get("/activity/{activity_id}", response_model=List[SubmissionOut])
def list_activity_submissions(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    submissions = db.query(Submission).filter(Submission.activity_id == activity_id).all()
    results = []
    for s in submissions:
        results.append(SubmissionOut(
            id=s.id,
            activity_id=s.activity_id,
            user_id=s.user_id,
            title=s.title,
            description=s.description,
            file_path=s.file_path,
            file_name=s.file_name,
            file_size=s.file_size,
            file_type=s.file_type,
            external_link=s.external_link,
            submitted_at=s.submitted_at,
            status=s.status,
            user_name=s.user.full_name if s.user else None,
            student_id=s.user.student_id if s.user else None,
            activity_topic=s.activity.topic if s.activity else None
        ))
    return results
