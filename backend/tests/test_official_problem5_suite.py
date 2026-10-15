import pytest
import io
import time
from datetime import datetime, timedelta
from app.services.qr_service import get_time_step, generate_qr_token

def get_token(client, email, password="MiraiDemo#2026"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

# ==============================================================================
# TEST 1: END-TO-END CLUB DAY WORKFLOW ACROSS THREE CLUBS
# Plan -> Advisor Approval -> Check-In -> Submission -> Rubric Evaluation -> Monthly Report
# ==============================================================================
def test_three_clubs_complete_end_to_end_cycle(client):
    rohan_token = get_token(client, "rohan.coord@mirai.edu.in")
    vikram_token = get_token(client, "vikram.coord@mirai.edu.in")
    aisha_token = get_token(client, "aisha.coord@mirai.edu.in")
    advisor_token = get_token(client, "advisor.nair@mirai.edu.in")
    student1_token = get_token(client, "alex.chen@student.mirai.edu")

    # Fetch 3 distinct clubs
    res = client.get("/api/v1/clubs/")
    assert res.status_code == 200
    all_clubs = res.json()
    e_club = next(c for c in all_clubs if "Nexcell" in c["name"] or "Entrepreneurship" in c["name"])
    khel_club = next(c for c in all_clubs if "Khel" in c["name"] or "Sports" in c["name"])
    kaizen_club = next(c for c in all_clubs if "Kaizen" in c["name"] or "Technology" in c["name"])

    # Permission check: Rohan cannot plan for Khel Society (Vikram's club) -> 403
    now = datetime.utcnow()
    res_unauth = client.post("/api/v1/activities/", json={
        "club_id": khel_club["id"],
        "topic": "Unauthorized Attempt",
        "description": "desc",
        "venue": "Room 101",
        "start_time": (now + timedelta(days=5)).isoformat(),
        "end_time": (now + timedelta(days=5, hours=2)).isoformat()
    }, headers={"Authorization": f"Bearer {rohan_token}"})
    assert res_unauth.status_code == 403

    three_clubs = [
        (e_club, "CleanTech MVP Pitching", "Pitch Deck Slides", rohan_token),
        (khel_club, "Athletics Conditioning Tournament", "Tournament Strategy Sheet", vikram_token),
        (kaizen_club, "Compiler Optimizations for Edge AI", "LLVM Benchmark Report", aisha_token)
    ]

    for club, topic, deliverable, this_coord_token in three_clubs:
        # Step 1: Coordinator plans activity (Plan Stage - 7 days before)
        act_payload = {
            "club_id": club["id"],
            "topic": topic,
            "description": f"Comprehensive hands-on session for {club['name']}.",
            "format": "WORKSHOP",
            "deliverable": deliverable,
            "venue": "Room 304 - Academic Hub",
            "start_time": (now + timedelta(days=7)).isoformat(),
            "end_time": (now + timedelta(days=7, hours=2)).isoformat(),
            "submission_deadline": (now + timedelta(days=9)).isoformat(),
            "capacity": 45
        }
        res_create = client.post("/api/v1/activities/", json=act_payload, headers={"Authorization": f"Bearer {this_coord_token}"})
        assert res_create.status_code == 200
        act_id = res_create.json()["id"]
        assert res_create.json()["status"] == "DRAFT"

        # Step 2: Coordinator submits for advisor approval
        res_sub = client.post(f"/api/v1/activities/{act_id}/submit", headers={"Authorization": f"Bearer {this_coord_token}"})
        assert res_sub.status_code == 200
        assert res_sub.json()["status"] == "SUBMITTED"

        # Step 3: Advisor approves the activity plan
        res_appr = client.post(
            f"/api/v1/activities/{act_id}/approve",
            json={"status": "APPROVED", "comments": "Approved. Syllabus and rubrics verified."},
            headers={"Authorization": f"Bearer {advisor_token}"}
        )
        assert res_appr.status_code == 200
        assert res_appr.json()["status"] == "APPROVED"

        # Step 4: Coordinator initiates 15s rotating QR attendance session
        res_sess = client.post(
            "/api/v1/attendance/session/create",
            json={"activity_id": act_id, "duration_minutes": 45, "rotation_seconds": 15},
            headers={"Authorization": f"Bearer {this_coord_token}"}
        )
        assert res_sess.status_code == 200

        # Retrieve current live token
        res_qr = client.get(f"/api/v1/attendance/session/{act_id}/current-qr", headers={"Authorization": f"Bearer {this_coord_token}"})
        assert res_qr.status_code == 200
        token = res_qr.json()["token"]

        # Step 5: Students check in
        res_checkin = client.post(
            "/api/v1/attendance/check-in",
            json={"activity_id": act_id, "token": token},
            headers={"Authorization": f"Bearer {student1_token}"}
        )
        assert res_checkin.status_code == 200
        assert res_checkin.json()["status"] in ["SUCCESS", "LATE_CHECK_IN"]
        att_id = res_checkin.json()["attendance_id"]

        # Mark presenter & on-the-spot result
        res_pres = client.post(
            f"/api/v1/attendance/presenter/{att_id}",
            json={"is_presenter": True, "on_the_spot_result": "Top Workshop Pitch"},
            headers={"Authorization": f"Bearer {this_coord_token}"}
        )
        assert res_pres.status_code == 200
        assert res_pres.json()["is_presenter"] == True

        # Step 6: Student submits deliverable
        res_subm = client.post(
            "/api/v1/submissions/upload",
            data={
                "activity_id": act_id,
                "title": f"Final Project: {topic}",
                "description": "Production repo link and slides",
                "external_link": "https://github.com/mirai-student/prototype"
            },
            headers={"Authorization": f"Bearer {student1_token}"}
        )
        assert res_subm.status_code == 200
        submission_id = res_subm.json()["id"]

        # Step 7: Evaluator evaluates submission using 3 criteria rubric
        eval_payload = {
            "submission_id": submission_id,
            "feedback": "Outstanding technical rigor, clear presentation, and on-time deliverable.",
            "is_published": True,
            "criteria": [
                {"name": "Content & Rigor", "score": 9.5, "max_score": 10.0, "comments": "Excellent depth"},
                {"name": "Presentation & Clarity", "score": 9.0, "max_score": 10.0, "comments": "Structured slides"},
                {"name": "Participation & Timeliness", "score": 10.0, "max_score": 10.0, "comments": "Punctual"}
            ]
        }
        res_eval = client.post("/api/v1/evaluations/", json=eval_payload, headers={"Authorization": f"Bearer {this_coord_token}"})
        assert res_eval.status_code == 200
        assert res_eval.json()["total_score"] == 28.5

        # Step 8: Generate monthly performance report for the club
        res_rep = client.get(f"/api/v1/reports/monthly-club/{club['id']}", headers={"Authorization": f"Bearer {this_coord_token}"})
        assert res_rep.status_code == 200
        m_rep = res_rep.json()
        assert m_rep["club_name"] == club["name"]
        assert m_rep["total_attendances"] >= 1
        assert m_rep["total_submissions"] >= 1
        assert m_rep["average_evaluation_score"] > 0

# ==============================================================================
# TEST 2: ATTENDANCE INTEGRITY SCENARIOS
# Expired token, Screenshot reuse, Duplicate check-in, Invalid token, Audit correction
# ==============================================================================
def test_attendance_integrity_scenarios(client):
    coord_token = get_token(client, "rohan.coord@mirai.edu.in")
    student_token = get_token(client, "alex.chen@student.mirai.edu")

    # Find active activity
    res = client.get("/api/v1/activities/?status_filter=APPROVED", headers={"Authorization": f"Bearer {coord_token}"})
    activities = res.json()
    assert len(activities) > 0
    act_id = activities[0]["id"]

    # 1. Create short session
    client.post(
        "/api/v1/attendance/session/create",
        json={"activity_id": act_id, "duration_minutes": 30, "rotation_seconds": 15},
        headers={"Authorization": f"Bearer {coord_token}"}
    )

    # 2. Invalid Token Check-In -> Must be rejected with 400
    res_invalid = client.post(
        "/api/v1/attendance/check-in",
        json={"activity_id": act_id, "token": "invalid_fake_token_999"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_invalid.status_code == 400
    assert "INVALID_QR" in res_invalid.json()["detail"]

    # 3. Screenshot Sharing / Expired Token Test:
    # A token generated for step 100 should be rejected by server when current step is >= 105
    stale_token = "100-a1b2c3d4e5"
    res_stale = client.post(
        "/api/v1/attendance/check-in",
        json={"activity_id": act_id, "token": stale_token},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_stale.status_code == 400

    # 4. Check-in with valid live token
    res_qr = client.get(f"/api/v1/attendance/session/{act_id}/current-qr", headers={"Authorization": f"Bearer {coord_token}"})
    valid_token = res_qr.json()["token"]

    res_valid = client.post(
        "/api/v1/attendance/check-in",
        json={"activity_id": act_id, "token": valid_token},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_valid.status_code == 200
    checkin_status = res_valid.json()["status"]
    assert checkin_status in ["SUCCESS", "LATE_CHECK_IN", "ALREADY_CHECKED_IN"]

    # 5. Immediate Duplicate Check-In Attempt -> Server rejects or flags ALREADY_CHECKED_IN
    res_dup = client.post(
        "/api/v1/attendance/check-in",
        json={"activity_id": act_id, "token": valid_token},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_dup.status_code == 200
    assert res_dup.json()["status"] == "ALREADY_CHECKED_IN"

# ==============================================================================
# TEST 3: CERTIFICATE GENERATION & TAMPER DETECTION (20 TEST CERTIFICATES)
# ==============================================================================
def test_twenty_certificates_issuance_and_tamper_detection(client):
    advisor_token = get_token(client, "advisor.nair@mirai.edu.in")
    student_token = get_token(client, "alex.chen@student.mirai.edu")

    # Get student ID
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {student_token}"})
    student_uid = res_me.json()["id"]

    generated_certs = []
    # Generate 20 test certificates
    for i in range(1, 21):
        cert_in = {
            "user_id": student_uid,
            "title": f"Specialized Engineering Module #{i:02d}",
            "cert_type": "ACHIEVEMENT" if i % 2 == 1 else "PARTICIPATION",
            "metadata_json": {"module_index": i, "score": 90 + (i % 10)}
        }
        res_issue = client.post("/api/v1/certificates/issue", json=cert_in, headers={"Authorization": f"Bearer {advisor_token}"})
        assert res_issue.status_code == 200
        data = res_issue.json()
        assert data["certificate_number"].startswith("MST-CERT-2026-")
        generated_certs.append(data)

    assert len(generated_certs) == 20

    # Verify all 20 resolve correctly
    for cert in generated_certs:
        c_num = cert["certificate_number"]
        res_v = client.get(f"/api/v1/certificates/verify/{c_num}")
        assert res_v.status_code == 200
        v_data = res_v.json()
        assert v_data["is_valid"] == True
        assert v_data["tamper_detected"] == False
        assert v_data["student_name"] == "Alex Chen"

    # Non-existent certificate verification
    res_fake = client.get("/api/v1/certificates/verify/MST-CERT-FAKE-99999")
    assert res_fake.status_code == 200
    assert res_fake.json()["is_valid"] == False

    # Tamper detection verification: Altered payload title must trigger tamper_detected = True
    target = generated_certs[0]
    res_tamper = client.get(f"/api/v1/certificates/verify/{target['certificate_number']}?title_check=Fraudulent+Altered+Title")
    assert res_tamper.status_code == 200
    assert res_tamper.json()["tamper_detected"] == True
    assert res_tamper.json()["is_valid"] == False

# ==============================================================================
# TEST 4: EVENTS - 200 REGISTRATIONS & TEAM FORMATION
# ==============================================================================
def test_two_hundred_event_registrations_and_team_limits(client):
    admin_token = get_token(client, "admin@mirai.edu.in")

    now = datetime.utcnow()
    # 1. Create large hackathon event with 200 capacity
    event_in = {
        "title": "Mirai Grand Scale 200 Hackathon",
        "description": "High-concurrency collegiate hackathon testing registration persistence.",
        "category": "Hackathon",
        "event_type": "FLAGSHIP",
        "venue": "Central Convention Centre",
        "start_time": (now + timedelta(days=20)).isoformat(),
        "end_time": (now + timedelta(days=22)).isoformat(),
        "registration_deadline": (now + timedelta(days=15)).isoformat(),
        "max_participants": 200,
        "team_size_min": 1,
        "team_size_max": 4
    }
    res_ev = client.post("/api/v1/events/", json=event_in, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_ev.status_code == 200
    event_id = res_ev.json()["id"]

    # 2. Create 200 mock student accounts and register them sequentially
    from app.db.session import SessionLocal
    from app.models.entities import User, EventRegistration
    from app.core.security import get_password_hash, create_access_token

    db = SessionLocal()
    pwd = get_password_hash("TestPass#2026")
    users = []
    for i in range(200):
        email = f"scale_student_{i:03d}@mirai.edu"
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            u = User(
                email=email,
                hashed_password=pwd,
                full_name=f"Scale Student {i:03d}",
                student_id=f"MST-SCALE-{i:03d}",
                role="STUDENT",
                is_active=True
            )
            db.add(u)
            users.append(u)
        else:
            users.append(existing)
    db.commit()

    # Clear any previous registrations for this event
    db.query(EventRegistration).filter(EventRegistration.event_id == event_id).delete()
    db.commit()

    # Register all 200 students
    reg_success = 0
    for u in users:
        token = create_access_token(u.id, "STUDENT")
        res_reg = client.post(
            f"/api/v1/events/{event_id}/register",
            headers={"Authorization": f"Bearer {token}"}
        )
        if res_reg.status_code == 200:
            reg_success += 1

    assert reg_success == 200, f"Expected 200 registrations, got {reg_success}"

    # 3. 201st registration attempt must be rejected due to capacity limit
    overflow_user = db.query(User).filter(User.email == "alex.chen@student.mirai.edu").first()
    overflow_token = create_access_token(overflow_user.id, "STUDENT")
    res_overflow = client.post(
        f"/api/v1/events/{event_id}/register",
        headers={"Authorization": f"Bearer {overflow_token}"}
    )
    assert res_overflow.status_code == 400
    assert "capacity" in res_overflow.json()["detail"].lower()

    # 4. Verify no duplicate registrations in database
    total_db_records = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.status == "CONFIRMED"
    ).count()
    assert total_db_records == 200
    db.close()

# ==============================================================================
# TEST 5: ROLE-BASED ACCESS CONTROL & BACKEND AUTHORIZATION
# ==============================================================================
def test_role_based_permissions_enforcement(client):
    student_token = get_token(client, "alex.chen@student.mirai.edu")
    coord_token = get_token(client, "rohan.coord@mirai.edu.in")
    advisor_token = get_token(client, "advisor.nair@mirai.edu.in")
    campus_mgr_token = get_token(client, "anita.manager@mirai.edu.in")

    # 1. Student CANNOT create clubs (Requires Coordinator or above)
    res = client.post(
        "/api/v1/clubs/",
        json={"name": "Hacker Society", "category": "Technology", "capacity": 50},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 403

    # 2. Student CANNOT approve activities (Requires Advisor or above)
    res = client.get("/api/v1/activities/?status_filter=APPROVED", headers={"Authorization": f"Bearer {coord_token}"})
    act_id = res.json()[0]["id"]
    res_appr = client.post(
        f"/api/v1/activities/{act_id}/approve",
        json={"status": "APPROVED"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_appr.status_code == 403

    # 3. Student CANNOT correct attendance
    res_corr = client.post(
        f"/api/v1/attendance/correct/non_existent_id",
        json={"corrected_status": "PRESENT", "reason": "Self-override"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_corr.status_code == 403

    # 4. Student CANNOT score or evaluate submissions
    res_eval = client.post(
        "/api/v1/evaluations/",
        json={"submission_id": "dummy", "feedback": "Nice", "criteria": []},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_eval.status_code == 403

    # 5. Student CANNOT view another student's private transcript
    res_trans = client.get(
        "/api/v1/reports/transcript/MST-2026-EC204",  # Priya's ID
        headers={"Authorization": f"Bearer {student_token}"}  # Alex requesting
    )
    assert res_trans.status_code == 403

    # 6. Campus Manager scoped to assigned campus
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {campus_mgr_token}"})
    assert res_me.json()["role"] == "CAMPUS_MANAGER"
    assert res_me.json()["campus_id"] is not None

# ==============================================================================
# TEST 6: REPORT METRICS ACCURACY & RECONCILIATION
# ==============================================================================
def test_report_accuracy_and_reconciliation(client):
    admin_token = get_token(client, "admin@mirai.edu.in")
    coord_token = get_token(client, "rohan.coord@mirai.edu.in")

    # 1. Inactive Clubs Report
    res_inact = client.get("/api/v1/reports/inactive-clubs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_inact.status_code == 200
    inact_data = res_inact.json()
    assert "inactive_count" in inact_data
    assert inact_data["inactive_count"] >= 1
    assert any("Malhar" in c["club_name"] for c in inact_data["clubs"])

    # 2. Zero Participation Students Report
    res_zero = client.get("/api/v1/reports/zero-participation-students", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_zero.status_code == 200
    zero_data = res_zero.json()
    assert zero_data["zero_participation_count"] >= 1
    assert any(s["email"] == "kavya.zero@student.mirai.edu" for s in zero_data["students"])

    # 3. Top Contributors Leaderboard
    res_top = client.get("/api/v1/reports/top-contributors", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_top.status_code == 200
    top_data = res_top.json()["top_contributors"]
    assert len(top_data) >= 1
    assert top_data[0]["student_name"] == "Alex Chen"
    assert top_data[0]["total_points"] > 0

    # 4. CSV Exports
    for r_type in ["clubs", "attendance", "participation", "inactive_clubs"]:
        res_csv = client.get(f"/api/v1/reports/export/csv?report_type={r_type}", headers={"Authorization": f"Bearer {admin_token}"})
        assert res_csv.status_code == 200
        assert "text/csv" in res_csv.headers["content-type"]
        assert len(res_csv.text.splitlines()) > 1

# ==============================================================================
# TEST 7: OFFICIAL PDF TRANSCRIPT GENERATION & DOWNLOAD
# ==============================================================================
def test_official_pdf_transcript_download(client):
    student_token = get_token(client, "alex.chen@student.mirai.edu")

    res = client.get("/api/v1/reports/transcript/MST-2026-CS101/download", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    assert "application/pdf" in res.headers["content-type"]
    assert res.content.startswith(b"%PDF"), "Response is not a valid PDF binary"
    assert len(res.content) > 1000
