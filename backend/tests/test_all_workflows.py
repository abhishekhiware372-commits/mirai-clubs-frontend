import pytest
import time
from datetime import datetime, timedelta
from app.services.qr_service import get_time_step, generate_qr_token

def get_auth_token(client, email, password="MiraiDemo#2026"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]

# 1. AUTHENTICATION TESTS
def test_auth_valid_and_invalid_login(client):
    # Valid login
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@mirai.edu.in",
        "password": "MiraiDemo#2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

    # Invalid password
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@mirai.edu.in",
        "password": "WrongPassword#123"
    })
    assert res.status_code == 401

    # Non-existent user
    res = client.post("/api/v1/auth/login", json={
        "email": "nobody@mirai.edu.in",
        "password": "MiraiDemo#2026"
    })
    assert res.status_code == 401

def test_auth_current_user_and_protected_access(client):
    token = get_auth_token(client, "alex.chen@student.mirai.edu")
    
    # Authorized
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "alex.chen@student.mirai.edu"

    # Unauthorized without token
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401

    # Role enforcement: student trying admin endpoint
    res = client.get("/api/v1/reports/export/csv", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

# 2. CLUBS TESTS
def test_clubs_retrieval_and_filtering(client):
    res = client.get("/api/v1/clubs/")
    assert res.status_code == 200
    clubs = res.json()
    assert len(clubs) == 4
    
    # Filter by category
    res = client.get("/api/v1/clubs/?category=Technology")
    assert res.status_code == 200
    tech_clubs = res.json()
    assert all(c["category"] == "Technology" for c in tech_clubs)

    # Search
    res = client.get("/api/v1/clubs/?search=Kaizen")
    assert res.status_code == 200
    assert any("Kaizen" in c["name"] for c in res.json())

# 3. MEMBERSHIPS & ENROLMENT TESTS
def test_membership_workflow(client):
    student_token = get_auth_token(client, "priya.patel@student.mirai.edu")
    coord_token = get_auth_token(client, "rohan.coord@mirai.edu.in")

    # Get E-Club ID
    res = client.get("/api/v1/clubs/")
    e_club = next(c for c in res.json() if "Entrepreneurship" in c["name"])
    
    # Student requests membership
    res = client.post(
        "/api/v1/memberships/request",
        json={"club_id": e_club["id"], "is_primary": False},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    req_data = res.json()
    assert req_data["status"] == "PENDING"
    mem_id = req_data["id"]

    # Duplicate prevention
    res_dup = client.post(
        "/api/v1/memberships/request",
        json={"club_id": e_club["id"], "is_primary": False},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_dup.status_code == 400
    assert "already have a pending" in res_dup.json()["detail"].lower()

    # Coordinator reviews and approves
    res_appr = client.post(
        f"/api/v1/memberships/{mem_id}/review",
        json={"status": "APPROVED"},
        headers={"Authorization": f"Bearer {coord_token}"}
    )
    assert res_appr.status_code == 200
    assert res_appr.json()["status"] == "APPROVED"

# 4. ACADEMIC CALENDAR & CLUB DAY ACTIVITY APPROVAL
def test_activity_lifecycle_and_advisor_approval(client):
    coord_token = get_auth_token(client, "rohan.coord@mirai.edu.in")
    advisor_token = get_auth_token(client, "advisor.nair@mirai.edu.in")

    res = client.get("/api/v1/clubs/")
    e_club = next(c for c in res.json() if "Entrepreneurship" in c["name"])

    # 1. Coordinator creates activity (7 days before)
    now = datetime.utcnow()
    act_data = {
        "club_id": e_club["id"],
        "topic": "CleanTech Pitch & Demo Session",
        "description": "Pitch session for campus sustainability projects.",
        "format": "WORKSHOP",
        "deliverable": "Pitch Deck Slides",
        "venue": "Room 302",
        "start_time": (now + timedelta(days=7)).isoformat(),
        "end_time": (now + timedelta(days=7, hours=2)).isoformat(),
        "submission_deadline": (now + timedelta(days=9)).isoformat(),
        "capacity": 40
    }
    res = client.post("/api/v1/activities/", json=act_data, headers={"Authorization": f"Bearer {coord_token}"})
    assert res.status_code == 200
    activity_id = res.json()["id"]
    assert res.json()["status"] == "DRAFT"

    # 2. Coordinator submits activity
    res = client.post(f"/api/v1/activities/{activity_id}/submit", headers={"Authorization": f"Bearer {coord_token}"})
    assert res.status_code == 200
    assert res.json()["status"] == "SUBMITTED"

    # 3. Advisor reviews and approves
    res = client.post(
        f"/api/v1/activities/{activity_id}/approve",
        json={"status": "APPROVED", "comments": "Approved. Syllabus matches criteria."},
        headers={"Authorization": f"Bearer {advisor_token}"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "APPROVED"

# 5. ROTATING QR ATTENDANCE & CORRECTION TESTS
def test_rotating_qr_attendance_and_correction(client):
    coord_token = get_auth_token(client, "rohan.coord@mirai.edu.in")
    student_token = get_auth_token(client, "alex.chen@student.mirai.edu")

    # Get an approved activity
    res = client.get("/api/v1/activities/?status_filter=APPROVED", headers={"Authorization": f"Bearer {coord_token}"})
    activities = res.json()
    act = activities[0]
    act_id = act["id"]

    # 1. Coordinator creates QR session
    res = client.post(
        "/api/v1/attendance/session/create",
        json={"activity_id": act_id, "duration_minutes": 30, "rotation_seconds": 15},
        headers={"Authorization": f"Bearer {coord_token}"}
    )
    assert res.status_code == 200

    # 2. Coordinator retrieves current rotating QR
    res = client.get(f"/api/v1/attendance/session/{act_id}/current-qr", headers={"Authorization": f"Bearer {coord_token}"})
    assert res.status_code == 200
    qr_data = res.json()
    valid_token = qr_data["token"]
    assert "data:image/png;base64," in qr_data["qr_code_data"]

    # 3. Student check-in with invalid token -> fails
    res = client.post(
        "/api/v1/attendance/check-in",
        json={"activity_id": act_id, "token": "invalid-token-123"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 400
    assert "INVALID_QR" in res.json()["detail"]

    # 4. Student check-in with valid rotating token -> succeeds
    res = client.post(
        "/api/v1/attendance/check-in",
        json={"activity_id": act_id, "token": valid_token},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    checkin_res = res.json()
    assert checkin_res["status"] in ["SUCCESS", "LATE_CHECK_IN"]
    att_id = checkin_res["attendance_id"]

    # 5. Duplicate check-in -> ALREADY_CHECKED_IN
    res_dup = client.post(
        "/api/v1/attendance/check-in",
        json={"activity_id": act_id, "token": valid_token},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_dup.status_code == 200
    assert res_dup.json()["status"] == "ALREADY_CHECKED_IN"

    # 6. Manual attendance correction with reason and audit
    res_corr = client.post(
        f"/api/v1/attendance/correct/{att_id}",
        json={"corrected_status": "EXCUSED", "reason": "Student had approved medical duty leave"},
        headers={"Authorization": f"Bearer {coord_token}"}
    )
    assert res_corr.status_code == 200
    assert res_corr.json()["new_status"] == "EXCUSED"

# 6. SUBMISSIONS & RUBRIC EVALUATIONS TESTS
def test_submissions_and_rubric_evaluations(client):
    student_token = get_auth_token(client, "alex.chen@student.mirai.edu")
    coord_token = get_auth_token(client, "rohan.coord@mirai.edu.in")

    res = client.get("/api/v1/activities/?status_filter=APPROVED", headers={"Authorization": f"Bearer {coord_token}"})
    act_id = res.json()[0]["id"]

    # Student uploads submission with external link
    res = client.post(
        "/api/v1/submissions/upload",
        data={
            "activity_id": act_id,
            "title": "Smart Campus Energy Grid",
            "description": "Simulation files and architecture schematic",
            "external_link": "https://github.com/alexchen/smart-grid"
        },
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    sub_id = res.json()["id"]

    # Evaluator scores submission using 3 criteria rubric
    eval_payload = {
        "submission_id": sub_id,
        "feedback": "Outstanding technical architecture and detailed cost breakdown.",
        "is_published": True,
        "criteria": [
            {"name": "Content & Rigor", "score": 9.5, "max_score": 10.0, "comments": "Excellent"},
            {"name": "Presentation", "score": 9.0, "max_score": 10.0, "comments": "Clear structure"},
            {"name": "Participation", "score": 10.0, "max_score": 10.0, "comments": "On time and thorough"}
        ]
    }
    res = client.post("/api/v1/evaluations/", json=eval_payload, headers={"Authorization": f"Bearer {coord_token}"})
    assert res.status_code == 200
    eval_res = res.json()
    assert eval_res["total_score"] == 28.5
    assert eval_res["is_published"] == True

# 7. EVENTS & TEAMS TESTS
def test_events_and_teams(client):
    student_token = get_auth_token(client, "priya.patel@student.mirai.edu")

    res = client.get("/api/v1/events/")
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 1
    event_id = events[0]["id"]

    # Form a team
    res = client.post(
        f"/api/v1/events/{event_id}/teams",
        json={"name": "Team Nova", "member_emails": ["alex.chen@student.mirai.edu"]},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 200
    assert res.json()["team_name"] == "Team Nova"

# 8. TWENTY CERTIFICATES & TAMPER DETECTION TESTS
def test_twenty_certificates_and_tamper_detection(client):
    advisor_token = get_auth_token(client, "advisor.nair@mirai.edu.in")
    
    # Retrieve student
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {get_auth_token(client, 'alex.chen@student.mirai.edu')}"})
    student_id = res.json()["id"]

    issued_certs = []
    # Issue 20 unique certificates
    for i in range(1, 21):
        cert_payload = {
            "user_id": student_id,
            "title": f"Workshop Completion Module #{i:02d}",
            "cert_type": "PARTICIPATION" if i % 2 == 0 else "ACHIEVEMENT"
        }
        res = client.post("/api/v1/certificates/issue", json=cert_payload, headers={"Authorization": f"Bearer {advisor_token}"})
        assert res.status_code == 200, res.text
        cert_data = res.json()
        assert cert_data["certificate_number"].startswith("MST-CERT-2026-")
        issued_certs.append(cert_data)

    assert len(issued_certs) == 20

    # Verify every certificate URL resolves correctly
    for cert in issued_certs:
        c_num = cert["certificate_number"]
        res = client.get(f"/api/v1/certificates/verify/{c_num}")
        assert res.status_code == 200
        data = res.json()
        assert data["is_valid"] == True
        assert data["tamper_detected"] == False
        assert data["certificate_number"] == c_num
        assert data["student_name"] == "Alex Chen"

    # Test Tamper Detection: altered title must be detected
    sample_cert = issued_certs[0]
    res_tampered = client.get(
        f"/api/v1/certificates/verify/{sample_cert['certificate_number']}?title_check=Altered+Fraudulent+Title"
    )
    assert res_tampered.status_code == 200
    tampered_data = res_tampered.json()
    assert tampered_data["tamper_detected"] == True
    assert tampered_data["is_valid"] == False

# 9. NOTIFICATIONS & REPORTS RECONCILIATION
def test_notifications_and_reports_reconciliation(client):
    student_token = get_auth_token(client, "alex.chen@student.mirai.edu")
    admin_token = get_auth_token(client, "admin@mirai.edu.in")

    # Notifications check
    res = client.get("/api/v1/notifications/", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    notifs = res.json()
    assert len(notifs) > 0

    # Read unread count
    res_count = client.get("/api/v1/notifications/unread-count", headers={"Authorization": f"Bearer {student_token}"})
    assert res_count.status_code == 200
    assert "unread_count" in res_count.json()

    # Mark all read
    res_read = client.post("/api/v1/notifications/read-all", headers={"Authorization": f"Bearer {student_token}"})
    assert res_read.status_code == 200

    # Co-curricular Transcript
    res_tr = client.get("/api/v1/reports/transcript/MST-2026-CS101", headers={"Authorization": f"Bearer {student_token}"})
    assert res_tr.status_code == 200
    tr_data = res_tr.json()
    assert tr_data["student"]["name"] == "Alex Chen"
    assert len(tr_data["clubs"]) >= 1
    assert len(tr_data["certificates"]) >= 1

    # CSV Export
    res_csv = client.get("/api/v1/reports/export/csv?report_type=clubs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Entrepreneurship" in res_csv.text

# 10. UNREGISTERED GOOGLE LOGIN & STRICT FOUR-CLUB RESTRICTION TESTS
def test_unregistered_google_user_rejected_and_registered_accepted(client):
    # Unregistered user -> 403 Forbidden with clear instruction
    res_unreg = client.post("/api/v1/auth/google-login", json={
        "email": "unregistered.stranger@gmail.com",
        "full_name": "Stranger"
    })
    assert res_unreg.status_code == 403
    assert "Account not registered" in res_unreg.json()["detail"]

    # Registered users -> Returns correct JWT and backend registered role
    role_accounts = [
        ("alex.chen@student.mirai.edu", "STUDENT"),
        ("rohan.coord@mirai.edu.in", "COORDINATOR"),
        ("advisor.nair@mirai.edu.in", "ADVISOR"),
        ("anita.manager@mirai.edu.in", "CAMPUS_MANAGER"),
        ("admin@mirai.edu.in", "ADMIN")
    ]
    for email, expected_role in role_accounts:
        res = client.post("/api/v1/auth/google-login", json={"email": email})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == expected_role

def test_four_clubs_strict_enforcement(client):
    coord_token = get_auth_token(client, "rohan.coord@mirai.edu.in")
    
    # Exactly 4 official clubs exist
    res = client.get("/api/v1/clubs/")
    assert res.status_code == 200
    clubs = res.json()
    assert len(clubs) == 4
    club_names = {c["name"] for c in clubs}
    assert "Nexcell — Entrepreneurship Club" in club_names
    assert "Khel Society — Sports Club" in club_names
    assert "Kaizen — Technology Club" in club_names
    assert "Malhar — Cultural Club" in club_names

    # Attempt to create a 5th club -> strictly rejected by backend
    res_create = client.post(
        "/api/v1/clubs/",
        json={
            "name": "Extra Unauthorized Club",
            "category": "Technology",
            "description": "Unauthorized club",
            "campus_id": clubs[0]["campus_id"],
            "capacity": 50
        },
        headers={"Authorization": f"Bearer {coord_token}"}
    )
    assert res_create.status_code == 400
    assert "strictly restricted to exactly four official clubs" in res_create.json()["detail"]
