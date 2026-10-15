import io
import csv
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.entities import (
    User, Club, ClubMembership, Activity, Attendance, Submission,
    Evaluation, Event, EventRegistration, Certificate, Campus
)
from app.api.deps import get_current_user, require_coordinator_or_above, require_campus_manager_or_above
from app.services.transcript_service import generate_transcript_pdf

router = APIRouter()

@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    role = current_user.role

    if role == "STUDENT":
        memberships_count = db.query(ClubMembership).filter(
            ClubMembership.user_id == current_user.id,
            ClubMembership.status == "APPROVED"
        ).count()

        attendances_count = db.query(Attendance).filter(
            Attendance.user_id == current_user.id,
            Attendance.status.in_(["PRESENT", "LATE"])
        ).count()

        submissions_count = db.query(Submission).filter(
            Submission.user_id == current_user.id
        ).count()

        events_count = db.query(EventRegistration).filter(
            EventRegistration.user_id == current_user.id,
            EventRegistration.status == "CONFIRMED"
        ).count()

        certs_count = db.query(Certificate).filter(
            Certificate.user_id == current_user.id
        ).count()

        return {
            "role": "STUDENT",
            "stats": {
                "active_clubs": memberships_count,
                "sessions_attended": attendances_count,
                "submissions_completed": submissions_count,
                "events_registered": events_count,
                "certificates_earned": certs_count
            }
        }

    elif role == "COORDINATOR":
        managed_club_ids = [
            m.club_id for m in db.query(ClubMembership).filter(
                ClubMembership.user_id == current_user.id,
                ClubMembership.role == "COORDINATOR",
                ClubMembership.status == "APPROVED"
            ).all()
        ]

        pending_memberships = db.query(ClubMembership).filter(
            ClubMembership.club_id.in_(managed_club_ids),
            ClubMembership.status == "PENDING"
        ).count() if managed_club_ids else 0

        activities_count = db.query(Activity).filter(
            Activity.club_id.in_(managed_club_ids)
        ).count() if managed_club_ids else 0

        pending_activities = db.query(Activity).filter(
            Activity.club_id.in_(managed_club_ids),
            Activity.status == "DRAFT"
        ).count() if managed_club_ids else 0

        total_members = db.query(ClubMembership).filter(
            ClubMembership.club_id.in_(managed_club_ids),
            ClubMembership.status == "APPROVED"
        ).count() if managed_club_ids else 0

        return {
            "role": "COORDINATOR",
            "stats": {
                "managed_clubs": len(managed_club_ids),
                "total_club_members": total_members,
                "pending_join_requests": pending_memberships,
                "total_activities": activities_count,
                "draft_activities": pending_activities
            }
        }

    elif role == "ADVISOR":
        advised_clubs = db.query(Club).filter(Club.advisor_id == current_user.id).all()
        advised_club_ids = [c.id for c in advised_clubs]

        pending_approvals = db.query(Activity).filter(
            Activity.club_id.in_(advised_club_ids),
            Activity.status == "SUBMITTED"
        ).count() if advised_club_ids else 0

        approved_activities = db.query(Activity).filter(
            Activity.club_id.in_(advised_club_ids),
            Activity.status == "APPROVED"
        ).count() if advised_club_ids else 0

        issued_certs = db.query(Certificate).filter(
            Certificate.issued_by == current_user.id
        ).count()

        return {
            "role": "ADVISOR",
            "stats": {
                "advised_clubs": len(advised_clubs),
                "pending_activity_approvals": pending_approvals,
                "approved_activities": approved_activities,
                "issued_certificates": issued_certs
            }
        }

    elif role == "CAMPUS_MANAGER":
        cid = current_user.campus_id
        campus_name = current_user.campus.name if current_user.campus else "Assigned Campus"
        students_q = db.query(User).filter(User.role == "STUDENT")
        clubs_q = db.query(Club).filter(Club.status != "ARCHIVED")
        events_q = db.query(Event)
        if cid:
            students_q = students_q.filter(User.campus_id == cid)
            clubs_q = clubs_q.filter(Club.campus_id == cid)
            events_q = events_q.filter((Event.campus_id == cid) | (Event.campus_id == None))

        campus_club_ids = [c.id for c in clubs_q.all()]
        activities_count = db.query(Activity).filter(Activity.club_id.in_(campus_club_ids)).count() if campus_club_ids else 0
        attendances_count = db.query(Attendance).join(Activity).filter(Activity.club_id.in_(campus_club_ids)).count() if campus_club_ids else 0

        return {
            "role": "CAMPUS_MANAGER",
            "campus_id": cid,
            "campus_name": campus_name,
            "stats": {
                "campus_students": students_q.count(),
                "campus_clubs": len(campus_club_ids),
                "campus_activities": activities_count,
                "campus_attendances": attendances_count,
                "campus_events": events_q.count()
            }
        }

    else:  # ADMIN
        total_students = db.query(User).filter(User.role == "STUDENT").count()
        total_clubs = db.query(Club).count()
        total_activities = db.query(Activity).count()
        total_events = db.query(Event).count()
        total_attendances = db.query(Attendance).count()
        total_certs = db.query(Certificate).count()

        return {
            "role": "ADMIN",
            "stats": {
                "registered_students": total_students,
                "active_clubs": total_clubs,
                "total_activities": total_activities,
                "total_events": total_events,
                "total_attendances": total_attendances,
                "issued_certificates": total_certs
            }
        }

@router.get("/transcript/{student_id}")
def get_student_transcript(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(User).filter(
        (User.id == student_id) | (User.student_id == student_id)
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # If student, ensure requesting own transcript
    if current_user.role == "STUDENT" and student.id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view another student's transcript")

    # Memberships
    memberships = db.query(ClubMembership).filter(
        ClubMembership.user_id == student.id,
        ClubMembership.status == "APPROVED"
    ).all()
    clubs_data = [
        {"club_name": m.club.name, "role": m.role, "joined_date": m.requested_at.strftime("%Y-%m-%d")}
        for m in memberships if m.club
    ]

    # Attendance Records
    attendances = db.query(Attendance).filter(
        Attendance.user_id == student.id,
        Attendance.status.in_(["PRESENT", "LATE"])
    ).all()
    attendance_data = [
        {
            "activity_topic": a.activity.topic if a.activity else "Club Session",
            "date": a.checked_in_at.strftime("%Y-%m-%d %H:%M"),
            "status": a.status,
            "is_late": a.is_late
        }
        for a in attendances
    ]

    # Submissions & Evaluations
    submissions = db.query(Submission).filter(Submission.user_id == student.id).all()
    submissions_data = []
    for s in submissions:
        eval_record = db.query(Evaluation).filter(
            Evaluation.submission_id == s.id,
            Evaluation.is_published == True
        ).first()
        submissions_data.append({
            "activity_topic": s.activity.topic if s.activity else "Activity",
            "title": s.title,
            "submitted_at": s.submitted_at.strftime("%Y-%m-%d"),
            "score": f"{eval_record.total_score}/{eval_record.max_score}" if eval_record else "Pending",
            "feedback": eval_record.feedback if eval_record else ""
        })

    # Event Participations
    events = db.query(EventRegistration).filter(
        EventRegistration.user_id == student.id,
        EventRegistration.status == "CONFIRMED"
    ).all()
    events_data = [
        {
            "event_title": e.event.title if e.event else "Campus Event",
            "venue": e.event.venue if e.event else "",
            "team_name": e.team.name if e.team else "Individual",
            "checked_in": e.checked_in
        }
        for e in events
    ]

    # Certificates
    certs = db.query(Certificate).filter(Certificate.user_id == student.id).all()
    certs_data = [
        {
            "certificate_number": c.certificate_number,
            "title": c.title,
            "cert_type": c.cert_type,
            "issue_date": c.issue_date.strftime("%B %d, %Y")
        }
        for c in certs
    ]

    return {
        "student": {
            "name": student.full_name,
            "student_id": student.student_id or "MST-STUDENT",
            "department": student.department or "Computer Science & Engineering",
            "year": student.year or "2026",
            "campus": student.campus.name if student.campus else "Main Campus"
        },
        "clubs": clubs_data,
        "attendances": attendance_data,
        "submissions": submissions_data,
        "events": events_data,
        "certificates": certs_data,
        "generated_at": datetime.utcnow().strftime("%B %d, %Y %H:%M UTC"),
        "institutional_verification": "Mirai School of Technology - Verified Co-Curricular Record"
    }

@router.get("/transcript/{student_id}/download")
@router.get("/transcript/{student_id}/pdf")
def download_student_transcript_pdf(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(User).filter(
        (User.id == student_id) | (User.student_id == student_id)
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == "STUDENT" and student.id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to download another student's transcript")

    transcript_data = get_student_transcript(student_id=student.id, db=db, current_user=current_user)
    pdf_path = generate_transcript_pdf(transcript_data)

    clean_id = (student.student_id or student.id).replace("/", "_").replace(" ", "_")
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"MST_CoCurricular_Transcript_{clean_id}.pdf"
    )

@router.get("/monthly-club/{club_id}")
def get_monthly_club_report(
    club_id: str,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    if current_user.role == "CAMPUS_MANAGER" and current_user.campus_id and club.campus_id != current_user.campus_id:
        raise HTTPException(status_code=403, detail="You can only access club reports for your assigned campus")

    now = datetime.utcnow()
    since_date = now - timedelta(days=days)

    active_members = db.query(ClubMembership).filter(
        ClubMembership.club_id == club.id,
        ClubMembership.status == "APPROVED"
    ).count()

    activities = db.query(Activity).filter(
        Activity.club_id == club.id,
        Activity.start_time >= since_date
    ).all()
    act_ids = [a.id for a in activities]

    total_activities = len(activities)
    total_attendances = db.query(Attendance).filter(Attendance.activity_id.in_(act_ids)).count() if act_ids else 0
    
    potential_attendances = max(active_members * total_activities, 1)
    attendance_pct = round((total_attendances / potential_attendances) * 100.0, 1) if (active_members and total_activities) else 0.0

    submissions = db.query(Submission).filter(Submission.activity_id.in_(act_ids)).all() if act_ids else []
    total_submissions = len(submissions)
    submission_completion_pct = round((total_submissions / max(total_attendances, 1)) * 100.0, 1) if total_attendances else 0.0

    eval_scores = [
        e.total_score for s in submissions for e in s.evaluations if e.is_published
    ]
    avg_score = round(sum(eval_scores) / len(eval_scores), 2) if eval_scores else 0.0

    activity_highlights = [
        {
            "id": a.id,
            "topic": a.topic,
            "format": a.format,
            "venue": a.venue,
            "date": a.start_time.strftime("%Y-%m-%d"),
            "status": a.status,
            "attendees": len(a.attendances),
            "submissions": len(a.submissions)
        }
        for a in activities
    ]

    return {
        "club_id": club.id,
        "club_name": club.name,
        "category": club.category,
        "campus": club.campus.name if club.campus else "Main Campus",
        "advisor": club.advisor.full_name if club.advisor else "Directorate",
        "reporting_period_days": days,
        "active_members": active_members,
        "capacity": club.capacity,
        "activities_held": total_activities,
        "total_attendances": total_attendances,
        "attendance_percentage": attendance_pct,
        "total_submissions": total_submissions,
        "submission_completion_rate": submission_completion_pct,
        "average_evaluation_score": avg_score,
        "activity_highlights": activity_highlights,
        "generated_at": now.strftime("%Y-%m-%d %H:%M UTC")
    }

@router.get("/inactive-clubs")
def get_inactive_clubs(
    threshold_days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    """
    Configurable Rule: An active club is classified as 'INACTIVE' if it has
    had 0 activities held or scheduled within the past `threshold_days` (default: 30 days).
    """
    now = datetime.utcnow()
    since_date = now - timedelta(days=threshold_days)

    query = db.query(Club).filter(Club.status != "ARCHIVED")
    if current_user.role == "CAMPUS_MANAGER" and current_user.campus_id:
        query = query.filter(Club.campus_id == current_user.campus_id)

    all_clubs = query.all()
    inactive_clubs = []

    for c in all_clubs:
        recent_acts_count = db.query(Activity).filter(
            Activity.club_id == c.id,
            Activity.start_time >= since_date
        ).count()
        if recent_acts_count == 0:
            member_count = db.query(ClubMembership).filter(
                ClubMembership.club_id == c.id,
                ClubMembership.status == "APPROVED"
            ).count()
            last_activity = db.query(Activity).filter(
                Activity.club_id == c.id
            ).order_by(Activity.start_time.desc()).first()

            inactive_clubs.append({
                "club_id": c.id,
                "club_name": c.name,
                "category": c.category,
                "campus": c.campus.name if c.campus else "Main Campus",
                "campus_id": c.campus_id,
                "member_count": member_count,
                "advisor": c.advisor.full_name if c.advisor else "Unassigned",
                "activities_in_window": 0,
                "last_activity_date": last_activity.start_time.strftime("%Y-%m-%d") if last_activity else "Never",
                "inactivity_reason": f"0 scheduled activities in past {threshold_days} days"
            })

    return {
        "rule_definition": f"Clubs with 0 activities in the past {threshold_days} days",
        "threshold_days": threshold_days,
        "inactive_count": len(inactive_clubs),
        "clubs": inactive_clubs
    }

@router.get("/zero-participation-students")
def get_zero_participation_students(
    campus_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    query = db.query(User).filter(User.role == "STUDENT", User.is_active == True)
    if current_user.role == "CAMPUS_MANAGER" and current_user.campus_id:
        query = query.filter(User.campus_id == current_user.campus_id)
    elif campus_id:
        query = query.filter(User.campus_id == campus_id)

    students = query.all()
    zero_part_students = []

    for s in students:
        att_cnt = db.query(Attendance).filter(Attendance.user_id == s.id).count()
        sub_cnt = db.query(Submission).filter(Submission.user_id == s.id).count()
        event_cnt = db.query(EventRegistration).filter(EventRegistration.user_id == s.id, EventRegistration.status == "CONFIRMED").count()

        if att_cnt == 0 and sub_cnt == 0 and event_cnt == 0:
            m_cnt = db.query(ClubMembership).filter(ClubMembership.user_id == s.id, ClubMembership.status == "APPROVED").count()
            zero_part_students.append({
                "user_id": s.id,
                "full_name": s.full_name,
                "student_id": s.student_id or "N/A",
                "email": s.email,
                "campus": s.campus.name if s.campus else "Main Campus",
                "department": s.department or "N/A",
                "year": s.year or "N/A",
                "enrolled_clubs_count": m_cnt,
                "participation_status": "ZERO_PARTICIPATION"
            })

    return {
        "zero_participation_count": len(zero_part_students),
        "students": zero_part_students
    }

@router.get("/top-contributors")
def get_top_contributors(
    limit: int = 10,
    campus_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User).filter(User.role == "STUDENT", User.is_active == True)
    if campus_id:
        query = query.filter(User.campus_id == campus_id)

    students = query.all()
    leaderboard = []

    for s in students:
        att_cnt = db.query(Attendance).filter(Attendance.user_id == s.id, Attendance.status.in_(["PRESENT", "LATE"])).count()
        sub_cnt = db.query(Submission).filter(Submission.user_id == s.id).count()
        cert_cnt = db.query(Certificate).filter(Certificate.user_id == s.id).count()
        event_cnt = db.query(EventRegistration).filter(EventRegistration.user_id == s.id, EventRegistration.status == "CONFIRMED").count()

        total_points = (att_cnt * 10) + (sub_cnt * 20) + (cert_cnt * 30) + (event_cnt * 15)
        if total_points > 0:
            leaderboard.append({
                "user_id": s.id,
                "student_name": s.full_name,
                "student_id": s.student_id or "N/A",
                "campus": s.campus.name if s.campus else "Main Campus",
                "department": s.department or "Engineering",
                "sessions_attended": att_cnt,
                "submissions": sub_cnt,
                "certificates": cert_cnt,
                "events": event_cnt,
                "total_points": total_points
            })

    leaderboard.sort(key=lambda x: x["total_points"], reverse=True)
    return {
        "top_contributors": leaderboard[:limit]
    }

@router.get("/campus-summary/{campus_id}")
def get_campus_summary(
    campus_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")

    if current_user.role == "CAMPUS_MANAGER" and current_user.campus_id and current_user.campus_id != campus_id:
        raise HTTPException(status_code=403, detail="Unauthorized to access records outside your assigned campus")

    clubs = db.query(Club).filter(Club.campus_id == campus_id, Club.status != "ARCHIVED").all()
    club_ids = [c.id for c in clubs]

    student_count = db.query(User).filter(User.campus_id == campus_id, User.role == "STUDENT").count()
    activities_count = db.query(Activity).filter(Activity.club_id.in_(club_ids)).count() if club_ids else 0
    attendances_count = db.query(Attendance).join(Activity).filter(Activity.club_id.in_(club_ids)).count() if club_ids else 0
    events_count = db.query(Event).filter((Event.campus_id == campus_id) | (Event.campus_id == None)).count()

    return {
        "campus_id": campus.id,
        "campus_name": campus.name,
        "campus_code": campus.code,
        "location": campus.location,
        "total_clubs": len(clubs),
        "total_students": student_count,
        "total_activities": activities_count,
        "total_attendances": attendances_count,
        "total_events": events_count
    }

@router.get("/export/csv")
def export_reports_csv(
    report_type: str = "clubs",  # "clubs", "attendance", "participation"
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinator_or_above)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "clubs":
        writer.writerow(["Club Name", "Category", "Campus", "Capacity", "Active Members", "Total Activities"])
        clubs = db.query(Club).all()
        for c in clubs:
            member_count = db.query(ClubMembership).filter(
                ClubMembership.club_id == c.id,
                ClubMembership.status == "APPROVED"
            ).count()
            act_count = db.query(Activity).filter(Activity.club_id == c.id).count()
            writer.writerow([
                c.name,
                c.category,
                c.campus.name if c.campus else "Main",
                c.capacity,
                member_count,
                act_count
            ])
    elif report_type == "attendance":
        writer.writerow(["Student Name", "Mains ID", "Activity Topic", "Club", "Check-in Time", "Status", "Is Late"])
        records = db.query(Attendance).all()
        for r in records:
            writer.writerow([
                r.user.full_name if r.user else "Unknown",
                r.user.student_id if r.user else "N/A",
                r.activity.topic if r.activity else "N/A",
                r.activity.club.name if r.activity and r.activity.club else "N/A",
                r.checked_in_at.isoformat(),
                r.status,
                "Yes" if r.is_late else "No"
            ])
    elif report_type == "inactive_clubs":
        writer.writerow(["Club Name", "Category", "Campus", "Active Members", "Inactivity Reason"])
        now = datetime.utcnow()
        since_date = now - timedelta(days=30)
        clubs = db.query(Club).filter(Club.status != "ARCHIVED").all()
        for c in clubs:
            recent_cnt = db.query(Activity).filter(Activity.club_id == c.id, Activity.start_time >= since_date).count()
            if recent_cnt == 0:
                m_cnt = db.query(ClubMembership).filter(ClubMembership.club_id == c.id, ClubMembership.status == "APPROVED").count()
                writer.writerow([c.name, c.category, c.campus.name if c.campus else "Main", m_cnt, "0 activities in past 30 days"])
    else:  # participation summary
        writer.writerow(["Student Name", "Student ID", "Clubs Joined", "Sessions Attended", "Submissions", "Certificates"])
        students = db.query(User).filter(User.role == "STUDENT").all()
        for s in students:
            m_cnt = db.query(ClubMembership).filter(ClubMembership.user_id == s.id, ClubMembership.status == "APPROVED").count()
            a_cnt = db.query(Attendance).filter(Attendance.user_id == s.id).count()
            sub_cnt = db.query(Submission).filter(Submission.user_id == s.id).count()
            c_cnt = db.query(Certificate).filter(Certificate.user_id == s.id).count()
            writer.writerow([s.full_name, s.student_id or "N/A", m_cnt, a_cnt, sub_cnt, c_cnt])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=mirai_clubs_report_{report_type}.csv"}
    )
