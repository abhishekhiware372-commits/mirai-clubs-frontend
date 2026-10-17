/**
 * MIRAI CLUBS — Centralized TypeScript Domain Types & API Contracts
 * Designed around MSOT Student Challenge: Problem 5 (Club Activities Tracker)
 * Matches backend schemas (FastAPI / PostgreSQL / SQLAlchemy / JWT)
 */

export type Role =
  | 'STUDENT'
  | 'STUDENT_COORDINATOR'
  | 'FACULTY_ADVISOR'
  | 'CAMPUS_MANAGER'
  | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  student_id?: string;
  role: Role;
  campus_id?: string;
  campus_name?: string;
  department?: string;
  year?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
  location?: string;
  created_at?: string;
  club_count?: number;
  student_count?: number;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  campus_id: string;
  campus_name?: string;
  category: 'Entrepreneurship' | 'Sports' | 'Technology' | 'Cultural' | 'Academic' | 'Social';
  advisor_id?: string;
  advisor_name?: string;
  coordinators?: Array<{ id: string; full_name: string; email: string }>;
  capacity: number;
  member_count: number;
  meeting_rules?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PROBATION';
  banner_url?: string;
  created_at: string;
  membership_status?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_A_MEMBER';
  is_primary?: boolean;
}

export interface ClubMembership {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  student_id?: string;
  club_id: string;
  club_name?: string;
  role: 'MEMBER' | 'COORDINATOR' | 'ADVISOR';
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  is_primary: boolean;
  join_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface JoinRequest {
  id: string;
  club_id: string;
  club_name: string;
  user_id: string;
  user_name: string;
  student_id: string;
  user_department: string;
  user_year: string;
  is_primary: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  statement?: string;
  submitted_at: string;
}

export type ActivityApprovalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';

export interface Activity {
  id: string;
  club_id: string;
  club_name?: string;
  title: string;
  topic: string;
  description: string;
  venue: string;
  date: string;
  start_time: string;
  end_time: string;
  deliverable_name: string;
  deliverable_description: string;
  deliverable_deadline: string;
  approval_status: ActivityApprovalStatus;
  advisor_comments?: string;
  announced: boolean;
  announced_at?: string;
  created_by_id: string;
  created_by_name?: string;
  created_at: string;
  attendance_count?: number;
  submission_count?: number;
}

export interface AttendanceSession {
  id: string;
  activity_id: string;
  activity_title: string;
  club_id: string;
  is_active: boolean;
  window_index: number;
  window_seconds: number;
  current_token: string;
  backup_code: string;
  expires_at: string;
  created_at: string;
  attendees_count: number;
}

export interface AttendanceRecord {
  id: string;
  activity_id: string;
  activity_title?: string;
  club_name?: string;
  user_id: string;
  user_name: string;
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  is_presenter: boolean;
  method: 'QR_SCAN' | 'BACKUP_CODE' | 'MANUAL_OVERRIDE';
  check_in_time: string;
  override_reason?: string;
  override_by_name?: string;
}

export interface AttendanceAudit {
  id: string;
  attendance_id: string;
  supervisor_id: string;
  supervisor_name: string;
  previous_status: string;
  new_status: string;
  reason: string;
  timestamp: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'Gambade' | 'Hackathon' | 'Conference' | 'Cross Road' | 'Workshop' | 'Symposium';
  event_type: 'FLAGSHIP' | 'CAMPUS' | 'INTER_CAMPUS';
  campus_id?: string;
  campus_name?: string;
  venue: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  max_participants: number;
  current_registrations: number;
  team_size_min: number;
  team_size_max: number;
  prize_pool?: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  banner_url?: string;
  user_registered?: boolean;
  user_team_name?: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  event_title?: string;
  user_id: string;
  user_name?: string;
  student_id?: string;
  team_name?: string;
  team_members?: string[];
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
  check_in_status: 'CHECKED_IN' | 'PENDING';
  registered_at: string;
}

export interface Submission {
  id: string;
  activity_id: string;
  activity_title: string;
  club_name: string;
  user_id: string;
  user_name: string;
  student_id: string;
  file_url: string;
  file_name: string;
  file_size_kb: number;
  notes?: string;
  submitted_at: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'EVALUATED' | 'LATE';
  score?: number;
  evaluation?: Evaluation;
}

export interface RubricCriterionScore {
  criterion_name: 'Content' | 'Presentation' | 'Participation' | 'Originality' | 'Execution';
  max_score: number;
  score: number;
  feedback?: string;
}

export interface Evaluation {
  id: string;
  submission_id: string;
  evaluator_id: string;
  evaluator_name: string;
  evaluator_role: 'FACULTY_ADVISOR' | 'STUDENT_COORDINATOR';
  rubric_scores: RubricCriterionScore[];
  total_score: number;
  max_total_score: number;
  comments: string;
  status: 'DRAFT' | 'PUBLISHED';
  evaluated_at: string;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  student_id: string;
  student_name: string;
  student_roll_no: string;
  title: string;
  event_or_club_name: string;
  issue_date: string;
  certificate_type: 'PARTICIPATION' | 'ACHIEVEMENT' | 'COORDINATOR_HONOR' | 'MERIT';
  verification_hash: string;
  download_url: string;
  verified: boolean;
}

export interface CoCurricularTranscript {
  student: {
    name: string;
    student_id: string;
    department: string;
    year: string;
    campus: string;
    overall_attendance_rate: number;
    total_co_curricular_credits: number;
    cumulative_score_avg: number;
  };
  club_tenure: Array<{
    club_name: string;
    role: string;
    joined_date: string;
    is_primary: boolean;
    attendance_pct: number;
  }>;
  activities_attended: Array<{
    date: string;
    club: string;
    activity_title: string;
    status: 'PRESENT' | 'PRESENTER';
    submission_score?: number;
  }>;
  flagship_events: Array<{
    title: string;
    date: string;
    role: string;
    achievement?: string;
  }>;
  certificates_earned: Array<{
    title: string;
    cert_no: string;
    date: string;
    hash: string;
  }>;
  verification_url: string;
  issued_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type:
    | 'JOIN_REQUEST'
    | 'CLUB_DAY_ANNOUNCEMENT'
    | 'ACTIVITY_APPROVAL'
    | 'CHANGES_REQUESTED'
    | 'ATTENDANCE_REMINDER'
    | 'SUBMISSION_REMINDER'
    | 'EVALUATION_PUBLISHED'
    | 'CERTIFICATE_ISSUED'
    | 'EVENT_REGISTRATION';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface ZeroParticipationStudent {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  department: string;
  year: string;
  campus_name: string;
  clubs_count: number;
  activities_attended: number;
}

export interface InactiveClub {
  id: string;
  name: string;
  campus_name: string;
  advisor_name?: string;
  last_activity_date?: string;
  days_inactive: number;
  status: string;
}

export interface DashboardStats {
  role: Role;
  metrics: Record<string, number | string>;
  recent_activities?: Activity[];
  upcoming_club_days?: Activity[];
  pending_approvals?: number;
  attendance_pct?: number;
  submission_rate?: number;
  average_score?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
