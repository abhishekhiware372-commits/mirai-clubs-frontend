from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# ----------------- AUTH & USER -----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    email: str
    id_token: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    student_id: Optional[str] = None
    role: str = "STUDENT"
    campus_id: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    phone: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    student_id: Optional[str] = None
    role: str
    campus_id: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- CAMPUS -----------------
class CampusCreate(BaseModel):
    name: str
    code: str
    location: Optional[str] = None

class CampusOut(BaseModel):
    id: str
    name: str
    code: str
    location: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- CLUBS -----------------
class ClubCreate(BaseModel):
    name: str
    description: str
    campus_id: str
    category: str
    advisor_id: Optional[str] = None
    capacity: int = 100
    meeting_rules: Optional[str] = None
    banner_url: Optional[str] = None

class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    advisor_id: Optional[str] = None
    capacity: Optional[int] = None
    meeting_rules: Optional[str] = None
    status: Optional[str] = None
    banner_url: Optional[str] = None

class ClubOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    campus_id: str
    category: str
    advisor_id: Optional[str] = None
    capacity: int
    meeting_rules: Optional[str] = None
    status: str
    banner_url: Optional[str] = None
    created_at: datetime
    member_count: Optional[int] = 0
    advisor_name: Optional[str] = None
    campus_name: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- MEMBERSHIP -----------------
class MembershipRequest(BaseModel):
    club_id: str
    is_primary: bool = True

class MembershipReview(BaseModel):
    status: str  # APPROVED, REJECTED
    rejection_reason: Optional[str] = None

class MembershipOut(BaseModel):
    id: str
    user_id: str
    club_id: str
    role: str
    status: str
    is_primary: bool
    requested_at: datetime
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    student_id: Optional[str] = None
    club_name: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- ACTIVITIES & CLUB DAY -----------------
class ActivityCreate(BaseModel):
    club_id: str
    topic: str
    description: str
    format: str = "WORKSHOP"
    deliverable: Optional[str] = None
    venue: str
    start_time: datetime
    end_time: datetime
    submission_deadline: Optional[datetime] = None
    capacity: int = 50

class ActivityApprovalAction(BaseModel):
    status: str  # APPROVED, REJECTED, CHANGES_REQUESTED
    comments: Optional[str] = None

class ActivityOut(BaseModel):
    id: str
    club_id: str
    topic: str
    description: str
    format: str
    deliverable: Optional[str] = None
    venue: str
    start_time: datetime
    end_time: datetime
    submission_deadline: Optional[datetime] = None
    advisor_id: Optional[str] = None
    capacity: int
    status: str
    created_by: str
    created_at: datetime
    club_name: Optional[str] = None
    advisor_name: Optional[str] = None
    attendee_count: Optional[int] = 0

    class Config:
        from_attributes = True

# ----------------- ROTATING QR & ATTENDANCE -----------------
class QRSessionCreate(BaseModel):
    activity_id: str
    duration_minutes: int = 45
    rotation_seconds: int = 15

class QRTokenCheckIn(BaseModel):
    activity_id: str
    token: str

class AttendanceCorrectionRequest(BaseModel):
    corrected_status: str  # PRESENT, EXCUSED, ABSENT
    reason: str

class PresenterUpdateRequest(BaseModel):
    is_presenter: bool = True
    on_the_spot_result: Optional[str] = None

class AttendanceOut(BaseModel):
    id: str
    activity_id: str
    user_id: str
    checked_in_at: datetime
    is_late: bool
    status: str
    method: str
    is_presenter: bool = False
    on_the_spot_result: Optional[str] = None
    user_name: Optional[str] = None
    student_id: Optional[str] = None
    activity_topic: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- SUBMISSIONS -----------------
class SubmissionCreate(BaseModel):
    activity_id: str
    title: str
    description: Optional[str] = None
    external_link: Optional[str] = None

class SubmissionOut(BaseModel):
    id: str
    activity_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    external_link: Optional[str] = None
    submitted_at: datetime
    status: str
    user_name: Optional[str] = None
    student_id: Optional[str] = None
    activity_topic: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- EVALUATIONS -----------------
class CriterionScore(BaseModel):
    name: str
    score: float
    max_score: float = 10.0
    comments: Optional[str] = None

class EvaluationCreate(BaseModel):
    submission_id: str
    feedback: Optional[str] = None
    is_published: bool = True
    criteria: List[CriterionScore]

class EvaluationOut(BaseModel):
    id: str
    submission_id: str
    evaluator_id: str
    total_score: float
    max_score: float
    feedback: Optional[str] = None
    is_published: bool
    evaluated_at: datetime
    evaluator_name: Optional[str] = None
    criteria: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

# ----------------- EVENTS & TEAMS -----------------
class EventCreate(BaseModel):
    title: str
    description: str
    campus_id: Optional[str] = None
    category: str
    event_type: str = "CAMPUS"
    venue: str
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    max_participants: int = 200
    team_size_min: int = 1
    team_size_max: int = 4
    prize_pool: Optional[str] = None

class EventOut(BaseModel):
    id: str
    title: str
    description: str
    campus_id: Optional[str] = None
    category: str
    event_type: str
    venue: str
    start_time: datetime
    end_time: datetime
    registration_deadline: datetime
    max_participants: int
    team_size_min: int
    team_size_max: int
    prize_pool: Optional[str] = None
    status: str
    created_at: datetime
    registration_count: Optional[int] = 0

    class Config:
        from_attributes = True

class TeamCreate(BaseModel):
    name: str
    member_emails: Optional[List[str]] = []

class EventRegistrationOut(BaseModel):
    id: str
    event_id: str
    user_id: str
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    registered_at: datetime
    checked_in: bool
    status: str
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- CERTIFICATES -----------------
class CertificateCreate(BaseModel):
    user_id: str
    title: str
    cert_type: str = "PARTICIPATION"  # PARTICIPATION, ACHIEVEMENT
    activity_id: Optional[str] = None
    event_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class CertificateOut(BaseModel):
    id: str
    certificate_number: str
    user_id: str
    user_name: Optional[str] = None
    title: str
    cert_type: str
    issue_date: datetime
    file_path: Optional[str] = None
    verification_hash: str
    verification_url: Optional[str] = None

    class Config:
        from_attributes = True

class CertificateVerifyOut(BaseModel):
    is_valid: bool
    certificate_number: str
    student_name: str
    title: str
    cert_type: str
    issue_date: str
    issuer: str
    tamper_detected: bool = False

# ----------------- NOTIFICATIONS -----------------
class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
