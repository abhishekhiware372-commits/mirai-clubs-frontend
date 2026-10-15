import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Campus(Base):
    __tablename__ = "campuses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True, index=True)
    location = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="campus")
    clubs = relationship("Club", back_populates="campus")
    events = relationship("Event", back_populates="campus")
    calendar_entries = relationship("AcademicCalendarEntry", back_populates="campus")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    student_id = Column(String(50), nullable=True, unique=True, index=True)  # Mains ID / Student Roll
    role = Column(String(30), nullable=False, default="STUDENT", index=True)  # STUDENT, COORDINATOR, ADVISOR, CAMPUS_MANAGER, ADMIN
    campus_id = Column(String(36), ForeignKey("campuses.id"), nullable=True)
    department = Column(String(100), nullable=True)
    year = Column(String(20), nullable=True)
    phone = Column(String(30), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campus = relationship("Campus", back_populates="users")
    memberships = relationship("ClubMembership", back_populates="user", foreign_keys="ClubMembership.user_id")
    advised_clubs = relationship("Club", back_populates="advisor", foreign_keys="Club.advisor_id")
    attendances = relationship("Attendance", back_populates="user")
    submissions = relationship("Submission", back_populates="user")
    certificates = relationship("Certificate", back_populates="user", foreign_keys="Certificate.user_id")
    notifications = relationship("Notification", back_populates="user")
    event_registrations = relationship("EventRegistration", back_populates="user")


class Club(Base):
    __tablename__ = "clubs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False, unique=True, index=True)
    slug = Column(String(150), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False)
    campus_id = Column(String(36), ForeignKey("campuses.id"), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Technology, Entrepreneurship, Robotics, Cultural, Sports, Arts
    advisor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    capacity = Column(Integer, default=100)
    meeting_rules = Column(Text, nullable=True)
    status = Column(String(20), default="ACTIVE", index=True)  # ACTIVE, INACTIVE, ARCHIVED
    banner_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campus = relationship("Campus", back_populates="clubs")
    advisor = relationship("User", back_populates="advised_clubs", foreign_keys=[advisor_id])
    memberships = relationship("ClubMembership", back_populates="club", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="club", cascade="all, delete-orphan")


class ClubMembership(Base):
    __tablename__ = "club_memberships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    club_id = Column(String(36), ForeignKey("clubs.id"), nullable=False, index=True)
    role = Column(String(30), default="MEMBER")  # MEMBER, COORDINATOR, LEAD
    status = Column(String(20), default="PENDING", index=True)  # PENDING, APPROVED, REJECTED, SUSPENDED
    is_primary = Column(Boolean, default=True)
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String(255), nullable=True)

    # Relationships
    user = relationship("User", back_populates="memberships", foreign_keys=[user_id])
    club = relationship("Club", back_populates="memberships")
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class AcademicCalendarEntry(Base):
    __tablename__ = "academic_calendar"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(150), nullable=False)
    date = Column(DateTime, nullable=False, index=True)
    campus_id = Column(String(36), ForeignKey("campuses.id"), nullable=True)
    term = Column(String(50), nullable=True)  # Spring 2026, Fall 2026
    entry_type = Column(String(30), default="CLUB_DAY", index=True)  # CLUB_DAY, EXAM, HOLIDAY, SYMPOSIUM
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campus = relationship("Campus", back_populates="calendar_entries")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    club_id = Column(String(36), ForeignKey("clubs.id"), nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    format = Column(String(50), default="WORKSHOP")  # WORKSHOP, SEMINAR, HACKATHON, HANDS_ON, PRESENTATION
    deliverable = Column(String(255), nullable=True)  # e.g. "Pitch Deck PPT or PDF"
    venue = Column(String(100), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    submission_deadline = Column(DateTime, nullable=True)
    advisor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    capacity = Column(Integer, default=50)
    status = Column(String(30), default="DRAFT", index=True)  # DRAFT, SUBMITTED, APPROVED, REJECTED, COMPLETED
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    club = relationship("Club", back_populates="activities")
    advisor = relationship("User", foreign_keys=[advisor_id])
    creator = relationship("User", foreign_keys=[created_by])
    approvals = relationship("ActivityApproval", back_populates="activity", cascade="all, delete-orphan")
    qr_sessions = relationship("QRSession", back_populates="activity", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="activity", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="activity", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="activity")


class ActivityApproval(Base):
    __tablename__ = "activity_approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    activity_id = Column(String(36), ForeignKey("activities.id"), nullable=False, index=True)
    advisor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), nullable=False)  # APPROVED, REJECTED, CHANGES_REQUESTED
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    activity = relationship("Activity", back_populates="approvals")
    advisor = relationship("User")


class QRSession(Base):
    __tablename__ = "qr_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    activity_id = Column(String(36), ForeignKey("activities.id"), nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    secret_key = Column(String(100), nullable=False)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    rotation_interval_seconds = Column(Integer, default=15)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    activity = relationship("Activity", back_populates="qr_sessions")
    attendances = relationship("Attendance", back_populates="qr_session")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    activity_id = Column(String(36), ForeignKey("activities.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    qr_session_id = Column(String(36), ForeignKey("qr_sessions.id"), nullable=True)
    checked_in_at = Column(DateTime, default=datetime.utcnow)
    is_late = Column(Boolean, default=False)
    status = Column(String(20), default="PRESENT")  # PRESENT, LATE, ABSENT, EXCUSED
    method = Column(String(20), default="QR_SCAN")  # QR_SCAN, MANUAL_CORRECTION
    is_presenter = Column(Boolean, default=False)
    on_the_spot_result = Column(String(100), nullable=True)  # e.g. "Best Pitch", "Top Hardware Demo", "Runner Up"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    activity = relationship("Activity", back_populates="attendances")
    user = relationship("User", back_populates="attendances")
    qr_session = relationship("QRSession", back_populates="attendances")
    corrections = relationship("AttendanceCorrection", back_populates="attendance", cascade="all, delete-orphan")


class AttendanceCorrection(Base):
    __tablename__ = "attendance_corrections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attendance_id = Column(String(36), ForeignKey("attendances.id"), nullable=False, index=True)
    original_status = Column(String(20), nullable=False)
    corrected_status = Column(String(20), nullable=False)
    reason = Column(Text, nullable=False)
    corrected_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    corrected_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    attendance = relationship("Attendance", back_populates="corrections")
    corrector = relationship("User", foreign_keys=[corrected_by])


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    campus_id = Column(String(36), ForeignKey("campuses.id"), nullable=True)  # None = Inter-campus
    category = Column(String(50), nullable=False, index=True)  # Hackathon, Cultural, Conference, Sports
    event_type = Column(String(50), default="CAMPUS")  # CAMPUS, INTER_CAMPUS, FLAGSHIP
    venue = Column(String(100), nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=False)
    max_participants = Column(Integer, default=200)
    team_size_min = Column(Integer, default=1)
    team_size_max = Column(Integer, default=4)
    prize_pool = Column(String(100), nullable=True)
    status = Column(String(20), default="UPCOMING")  # UPCOMING, ONGOING, COMPLETED, CANCELLED
    banner_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campus = relationship("Campus", back_populates="events")
    teams = relationship("EventTeam", back_populates="event", cascade="all, delete-orphan")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="event")


class EventTeam(Base):
    __tablename__ = "event_teams"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    leader_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event", back_populates="teams")
    leader = relationship("User", foreign_keys=[leader_id])
    members = relationship("EventTeamMember", back_populates="team", cascade="all, delete-orphan")
    registrations = relationship("EventRegistration", back_populates="team")


class EventTeamMember(Base):
    __tablename__ = "event_team_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    team_id = Column(String(36), ForeignKey("event_teams.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(50), default="MEMBER")
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    team = relationship("EventTeam", back_populates="members")
    user = relationship("User")


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    team_id = Column(String(36), ForeignKey("event_teams.id"), nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime, nullable=True)
    result_rank = Column(String(50), nullable=True)  # "1st Place", "Finalist", etc.
    status = Column(String(20), default="CONFIRMED")  # CONFIRMED, CANCELLED

    # Relationships
    event = relationship("Event", back_populates="registrations")
    user = relationship("User", back_populates="event_registrations")
    team = relationship("EventTeam", back_populates="registrations")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    activity_id = Column(String(36), ForeignKey("activities.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(255), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(50), nullable=True)
    external_link = Column(String(255), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="SUBMITTED")  # SUBMITTED, EVALUATED, RESUBMISSION_REQUIRED

    # Relationships
    activity = relationship("Activity", back_populates="submissions")
    user = relationship("User", back_populates="submissions")
    evaluations = relationship("Evaluation", back_populates="submission", cascade="all, delete-orphan")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False, index=True)
    evaluator_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    total_score = Column(Float, nullable=False)
    max_score = Column(Float, default=100.0)
    feedback = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False)
    evaluated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    submission = relationship("Submission", back_populates="evaluations")
    evaluator = relationship("User")
    criteria = relationship("EvaluationCriterion", back_populates="evaluation", cascade="all, delete-orphan")


class EvaluationCriterion(Base):
    __tablename__ = "evaluation_criteria"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evaluation_id = Column(String(36), ForeignKey("evaluations.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g. Content, Presentation, Technical Feasibility
    score = Column(Float, nullable=False)
    max_score = Column(Float, default=10.0)
    comments = Column(String(255), nullable=True)

    # Relationships
    evaluation = relationship("Evaluation", back_populates="criteria")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    certificate_number = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    cert_type = Column(String(30), nullable=False)  # PARTICIPATION, ACHIEVEMENT, EXCELLENCE
    issued_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    activity_id = Column(String(36), ForeignKey("activities.id"), nullable=True)
    event_id = Column(String(36), ForeignKey("events.id"), nullable=True)
    issue_date = Column(DateTime, default=datetime.utcnow)
    file_path = Column(String(255), nullable=True)
    verification_hash = Column(String(128), nullable=False, index=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="certificates", foreign_keys=[user_id])
    issuer = relationship("User", foreign_keys=[issued_by])
    activity = relationship("Activity", back_populates="certificates")
    event = relationship("Event", back_populates="certificates")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO")  # INFO, APPROVAL, DEADLINE, CERTIFICATE
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # ATTENDANCE_CORRECTION, SCORE_CHANGE, ROLE_CHANGE
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
