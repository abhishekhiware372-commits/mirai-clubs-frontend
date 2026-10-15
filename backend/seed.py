import sys
import os
from datetime import datetime, timedelta

# Ensure python path includes backend
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.entities import (
    Campus, User, Club, ClubMembership, AcademicCalendarEntry, Activity,
    ActivityApproval, Attendance, Submission, Evaluation, EvaluationCriterion,
    Event, EventRegistration, Certificate, Notification
)
from app.services.certificate_service import generate_certificate_pdf, compute_certificate_hash

def seed_database():
    print("🌱 Seeding Mirai Clubs database with official 4 campuses, 30+ clubs, and all 5 roles...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear old demo data for clean repeatable seed
        if db.query(User).filter(User.email == "admin@mirai.edu.in").first():
            print("Refreshing database schema for clean seed...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)

        # 1. Four Campuses
        campus_blr = Campus(
            name="Mirai Main Campus - Tech City",
            code="MST-BLR",
            location="Electronic City Phase 1, Bangalore"
        )
        campus_ncr = Campus(
            name="Mirai North Campus - Innovation Hub",
            code="MST-NCR",
            location="Cyber Valley Sector 62, Noida"
        )
        campus_hyd = Campus(
            name="Mirai Cyber Campus - Tech Valley",
            code="MST-HYD",
            location="HITEC City Phase 2, Hyderabad"
        )
        campus_pun = Campus(
            name="Mirai Western Campus - Engineering Park",
            code="MST-PUN",
            location="Hinjawadi Infotech Park, Pune"
        )
        campuses = [campus_blr, campus_ncr, campus_hyd, campus_pun]
        db.add_all(campuses)
        db.flush()

        # 2. Users representing all 5 user roles
        pwd_hash = get_password_hash("MiraiDemo#2026")

        # Role 1: ADMIN / PROGRAM MANAGER
        admin_user = User(
            email="admin@mirai.edu.in",
            hashed_password=pwd_hash,
            full_name="Dr. Vikram Sen",
            role="ADMIN",
            campus_id=campus_blr.id,
            department="Dean of Student Affairs",
            is_active=True,
            is_verified=True
        )

        # Role 2: CAMPUS MANAGER
        campus_mgr = User(
            email="anita.manager@mirai.edu.in",
            hashed_password=pwd_hash,
            full_name="Anita Desai",
            role="CAMPUS_MANAGER",
            campus_id=campus_blr.id,
            department="Campus Operations & Student Life",
            phone="+91 98450 12345",
            is_active=True,
            is_verified=True
        )

        # Role 3: FACULTY ADVISOR
        advisor_user = User(
            email="advisor.nair@mirai.edu.in",
            hashed_password=pwd_hash,
            full_name="Dr. Radha Nair",
            role="ADVISOR",
            campus_id=campus_blr.id,
            department="Computer Science & Engineering",
            phone="+91 98110 54321",
            is_active=True,
            is_verified=True
        )

        # Role 4: STUDENT COORDINATORS (For 3 core clubs)
        coord_user = User(
            email="rohan.coord@mirai.edu.in",
            hashed_password=pwd_hash,
            full_name="Rohan Sharma",
            student_id="MST-2024-CS088",
            role="COORDINATOR",
            campus_id=campus_blr.id,
            department="CSE - 3rd Year",
            year="3rd Year",
            phone="+91 98220 99887",
            is_active=True,
            is_verified=True
        )
        coord_vikram = User(
            email="vikram.coord@mirai.edu.in",
            hashed_password=pwd_hash,
            full_name="Vikram Joshi",
            student_id="MST-2024-EC042",
            role="COORDINATOR",
            campus_id=campus_blr.id,
            department="ECE - 3rd Year",
            year="3rd Year",
            phone="+91 98220 11223",
            is_active=True,
            is_verified=True
        )
        coord_aisha = User(
            email="aisha.coord@mirai.edu.in",
            hashed_password=pwd_hash,
            full_name="Aisha Khan",
            student_id="MST-2024-CS099",
            role="COORDINATOR",
            campus_id=campus_ncr.id,
            department="CSE - 3rd Year",
            year="3rd Year",
            phone="+91 98220 33445",
            is_active=True,
            is_verified=True
        )

        # Role 5: STUDENTS
        student_alex = User(
            email="alex.chen@student.mirai.edu",
            hashed_password=pwd_hash,
            full_name="Alex Chen",
            student_id="MST-2026-CS101",
            role="STUDENT",
            campus_id=campus_blr.id,
            department="Computer Science & AI",
            year="2nd Year",
            phone="+91 98765 43210",
            is_active=True,
            is_verified=True
        )
        student_priya = User(
            email="priya.patel@student.mirai.edu",
            hashed_password=pwd_hash,
            full_name="Priya Patel",
            student_id="MST-2026-EC204",
            role="STUDENT",
            campus_id=campus_blr.id,
            department="Electronics & Robotics",
            year="2nd Year",
            phone="+91 98765 11223",
            is_active=True,
            is_verified=True
        )
        student_zero = User(
            email="kavya.zero@student.mirai.edu",
            hashed_password=pwd_hash,
            full_name="Kavya Rao",
            student_id="MST-2026-DS305",
            role="STUDENT",
            campus_id=campus_blr.id,
            department="Data Science",
            year="1st Year",
            phone="+91 98765 99001",
            is_active=True,
            is_verified=True
        )

        core_users = [admin_user, campus_mgr, advisor_user, coord_user, coord_vikram, coord_aisha, student_alex, student_priya, student_zero]
        db.add_all(core_users)
        db.flush()

        # 3. Clubs Registry: EXACTLY FOUR OFFICIAL CLUBS
        # Club 1: Nexcell — Entrepreneurship Club
        club_nexcell = Club(
            name="Nexcell — Entrepreneurship Club",
            slug="nexcell",
            description="Empowering student founders, venture builders, and product creators. Fosters 0-to-1 startup creation, incubator access, and angel funding.",
            campus_id=campus_blr.id,
            category="Entrepreneurship",
            advisor_id=advisor_user.id,
            capacity=100,
            meeting_rules="Every Friday 4:30 PM at Campus Innovation Hub",
            status="ACTIVE",
            banner_url="https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80"
        )
        # Club 2: Khel Society — Sports Club
        club_khel = Club(
            name="Khel Society — Sports Club",
            slug="khel-society",
            description="Official collegiate athletic society fostering physical fitness, intramural tournaments, athletics, competitive sportsmanship, and endurance.",
            campus_id=campus_blr.id,
            category="Sports",
            advisor_id=advisor_user.id,
            capacity=120,
            meeting_rules="Every Tuesday & Thursday 5:30 PM at University Sports Arena",
            status="ACTIVE",
            banner_url="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80"
        )
        # Club 3: Kaizen — Technology Club
        club_kaizen = Club(
            name="Kaizen — Technology Club",
            slug="kaizen",
            description="Continuous technical improvement guild dedicated to systems software, robotics avionics, AI infrastructure, and open-source computing.",
            campus_id=campus_ncr.id,
            category="Technology",
            advisor_id=advisor_user.id,
            capacity=100,
            meeting_rules="Every Saturday 10:00 AM at Software Research Annex",
            status="ACTIVE",
            banner_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80"
        )
        # Club 4: Malhar — Cultural Club
        club_malhar = Club(
            name="Malhar — Cultural Club",
            slug="malhar",
            description="Vibrant cultural and performing arts collective celebrating music, theatre, literary arts, photography, and creative design across campuses.",
            campus_id=campus_pun.id,
            category="Cultural",
            advisor_id=advisor_user.id,
            capacity=90,
            meeting_rules="Every Wednesday 5:00 PM at University Amphitheatre",
            status="ACTIVE",
            banner_url="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80"
        )

        seeded_clubs = [club_nexcell, club_khel, club_kaizen, club_malhar]
        db.add_all(seeded_clubs)
        db.flush()

        # 4. Memberships for Core Users
        mem_coord_nexcell = ClubMembership(
            user_id=coord_user.id,
            club_id=club_nexcell.id,
            role="COORDINATOR",
            status="APPROVED",
            is_primary=True,
            reviewed_by=advisor_user.id,
            reviewed_at=datetime.utcnow() - timedelta(days=30)
        )
        mem_coord_malhar = ClubMembership(
            user_id=coord_user.id,
            club_id=club_malhar.id,
            role="COORDINATOR",
            status="APPROVED",
            is_primary=False,
            reviewed_by=advisor_user.id,
            reviewed_at=datetime.utcnow() - timedelta(days=30)
        )
        mem_coord_khel = ClubMembership(
            user_id=coord_vikram.id,
            club_id=club_khel.id,
            role="COORDINATOR",
            status="APPROVED",
            is_primary=True,
            reviewed_by=advisor_user.id,
            reviewed_at=datetime.utcnow() - timedelta(days=25)
        )
        mem_coord_kaizen = ClubMembership(
            user_id=coord_aisha.id,
            club_id=club_kaizen.id,
            role="COORDINATOR",
            status="APPROVED",
            is_primary=True,
            reviewed_by=advisor_user.id,
            reviewed_at=datetime.utcnow() - timedelta(days=25)
        )
        mem_alex_nexcell = ClubMembership(
            user_id=student_alex.id,
            club_id=club_nexcell.id,
            role="MEMBER",
            status="APPROVED",
            is_primary=True,
            reviewed_by=coord_user.id,
            reviewed_at=datetime.utcnow() - timedelta(days=20)
        )
        mem_alex_kaizen = ClubMembership(
            user_id=student_alex.id,
            club_id=club_kaizen.id,
            role="MEMBER",
            status="APPROVED",
            is_primary=False,
            reviewed_by=coord_aisha.id,
            reviewed_at=datetime.utcnow() - timedelta(days=15)
        )
        mem_priya_khel = ClubMembership(
            user_id=student_priya.id,
            club_id=club_khel.id,
            role="MEMBER",
            status="APPROVED",
            is_primary=True,
            reviewed_by=coord_vikram.id,
            reviewed_at=datetime.utcnow() - timedelta(days=10)
        )
        db.add_all([
            mem_coord_nexcell, mem_coord_malhar, mem_coord_khel, mem_coord_kaizen,
            mem_alex_nexcell, mem_alex_kaizen, mem_priya_khel
        ])
        db.flush()

        # 5. Academic Calendar Entries (One Month of Club Days)
        now = datetime.utcnow()
        cal_entries = [
            AcademicCalendarEntry(
                title="Club Day 1: AI Systems & Rapid Prototyping",
                date=now - timedelta(days=14),
                campus_id=campus_blr.id,
                term="Spring 2026",
                entry_type="CLUB_DAY",
                description="Campus-wide Club Day dedicated to hands-on AI prototyping and startup MVP builds."
            ),
            AcademicCalendarEntry(
                title="Club Day 2: Athletic Performance & Conditioning",
                date=now - timedelta(days=7),
                campus_id=campus_blr.id,
                term="Spring 2026",
                entry_type="CLUB_DAY",
                description="Inter-departmental athletics tournament and sports physiology session."
            ),
            AcademicCalendarEntry(
                title="Club Day 3: Startup Unit Economics & Pitching",
                date=now + timedelta(days=3),
                campus_id=campus_blr.id,
                term="Spring 2026",
                entry_type="CLUB_DAY",
                description="VC jury panel review and business model breakdown for student projects."
            ),
            AcademicCalendarEntry(
                title="Club Day 4: Open Source Release Showcase",
                date=now + timedelta(days=10),
                campus_id=campus_blr.id,
                term="Spring 2026",
                entry_type="CLUB_DAY",
                description="Public demonstration and benchmarking of semester open-source deliverables."
            ),
        ]
        db.add_all(cal_entries)
        db.flush()

        # 6. Activities for the Official Clubs
        # Club 1: Nexcell (Completed past session & Approved upcoming session)
        act1 = Activity(
            club_id=club_nexcell.id,
            topic="Venture Ideation & Edge AI Prototyping",
            description="Formulate customer problem statements and deploy local LLM prototypes on edge devices.",
            format="WORKSHOP",
            deliverable="Pitch Deck PDF or GitHub Prototype Repository Link",
            venue="Campus Innovation Hub - Room 302",
            start_time=now - timedelta(days=14, hours=2),
            end_time=now - timedelta(days=14),
            submission_deadline=now - timedelta(days=12),
            advisor_id=advisor_user.id,
            capacity=50,
            status="COMPLETED",
            created_by=coord_user.id
        )
        act2 = Activity(
            club_id=club_nexcell.id,
            topic="Unit Economics, TAM Analysis & Investor Pitching",
            description="Deep dive into financial modeling, market size estimations, and high-impact slide decks.",
            format="SEMINAR",
            deliverable="1-Page Executive Summary & Financial Sheet",
            venue="Auditorium B - Innovation Wing",
            start_time=now + timedelta(days=3, hours=4),
            end_time=now + timedelta(days=3, hours=7),
            submission_deadline=now + timedelta(days=5),
            advisor_id=advisor_user.id,
            capacity=60,
            status="APPROVED",
            created_by=coord_user.id
        )

        # Club 2: Khel Society (Completed past activity & Submitted pending plan)
        act3 = Activity(
            club_id=club_khel.id,
            topic="Intramural Athletics & Performance Conditioning",
            description="Athletic conditioning protocols, endurance drills, and tournament strategy analysis.",
            format="HANDS_ON",
            deliverable="Athletic Training Log & Biomechanics Analysis",
            venue="University Sports Arena - Field A",
            start_time=now - timedelta(days=7, hours=3),
            end_time=now - timedelta(days=7),
            submission_deadline=now - timedelta(days=5),
            advisor_id=advisor_user.id,
            capacity=40,
            status="COMPLETED",
            created_by=coord_vikram.id
        )
        act4 = Activity(
            club_id=club_khel.id,
            topic="Inter-Campus Football & Strategy Clinic",
            description="Tactical football strategy, sportsmanship workshops, and inter-campus team scrimmages.",
            format="WORKSHOP",
            deliverable="Tactical Game Analysis Sheet",
            venue="Central Sports Ground",
            start_time=now + timedelta(days=7, hours=2),
            end_time=now + timedelta(days=7, hours=5),
            submission_deadline=now + timedelta(days=9),
            advisor_id=advisor_user.id,
            capacity=35,
            status="SUBMITTED",
            created_by=coord_vikram.id
        )

        # Club 3: Kaizen (Completed past activity & Approved upcoming)
        act5 = Activity(
            club_id=club_kaizen.id,
            topic="Distributed Consensus & High-Throughput Raft Implementations",
            description="Benchmarking Paxos vs Raft protocol implementations under heavy network packet loss.",
            format="WORKSHOP",
            deliverable="Go Raft Protocol Implementation Benchmark Report",
            venue="Systems Research Lab - Annex 101",
            start_time=now - timedelta(days=10, hours=2),
            end_time=now - timedelta(days=10),
            submission_deadline=now - timedelta(days=8),
            advisor_id=advisor_user.id,
            capacity=50,
            status="COMPLETED",
            created_by=coord_aisha.id
        )

        # Club 4: Malhar — Cultural Club (Has had 0 activities in 30 days -> Inactive Club by rule!)
        db.add_all([act1, act2, act3, act4, act5])
        db.flush()

        # Activity approvals history
        appr1 = ActivityApproval(activity_id=act1.id, advisor_id=advisor_user.id, status="APPROVED", comments="Approved for Club Day 1.")
        appr2 = ActivityApproval(activity_id=act2.id, advisor_id=advisor_user.id, status="APPROVED", comments="Approved for Club Day 3.")
        appr3 = ActivityApproval(activity_id=act3.id, advisor_id=advisor_user.id, status="APPROVED", comments="Athletics conditioning plan approved.")
        appr5 = ActivityApproval(activity_id=act5.id, advisor_id=advisor_user.id, status="APPROVED", comments="Distributed systems syllabus approved.")
        db.add_all([appr1, appr2, appr3, appr5])
        db.flush()

        # 7. Past Attendance Records (with Presenter & On-the-spot result data)
        att_alex_act1 = Attendance(
            activity_id=act1.id,
            user_id=student_alex.id,
            checked_in_at=act1.start_time + timedelta(minutes=5),
            is_late=False,
            status="PRESENT",
            method="QR_SCAN",
            is_presenter=True,
            on_the_spot_result="Best Engineering Prototype"
        )
        att_priya_act3 = Attendance(
            activity_id=act3.id,
            user_id=student_priya.id,
            checked_in_at=act3.start_time + timedelta(minutes=4),
            is_late=False,
            status="PRESENT",
            method="QR_SCAN",
            is_presenter=True,
            on_the_spot_result="Top Hardware Calibration"
        )
        att_alex_act5 = Attendance(
            activity_id=act5.id,
            user_id=student_alex.id,
            checked_in_at=act5.start_time + timedelta(minutes=8),
            is_late=False,
            status="PRESENT",
            method="QR_SCAN",
            is_presenter=False
        )
        db.add_all([att_alex_act1, att_priya_act3, att_alex_act5])
        db.flush()

        # 8. Deliverable Submissions
        sub_alex_act1 = Submission(
            activity_id=act1.id,
            user_id=student_alex.id,
            title="CleanGrid: Edge AI Smart Metering Protocol",
            description="IoT hardware firmware and predictive demand-balancing dashboard for college dorms.",
            external_link="https://github.com/mirai-mst/cleangrid-prototype",
            submitted_at=act1.start_time + timedelta(hours=24),
            status="EVALUATED"
        )
        sub_priya_act3 = Submission(
            activity_id=act3.id,
            user_id=student_priya.id,
            title="TeleOp ROS 2 Hexapod Controller",
            description="Kinematic inverse gait generator with real-time feedback loop.",
            external_link="https://github.com/priyapatel/hexapod-ros2",
            submitted_at=act3.start_time + timedelta(hours=18),
            status="EVALUATED"
        )
        db.add_all([sub_alex_act1, sub_priya_act3])
        db.flush()

        # 9. Rubric Evaluations (Content, Presentation, Participation)
        eval_alex = Evaluation(
            submission_id=sub_alex_act1.id,
            evaluator_id=coord_user.id,
            total_score=28.5,
            max_score=30.0,
            feedback="Exceptional prototype. Sensor integration and telemetry pipeline exceeded workshop expectations.",
            is_published=True,
            evaluated_at=act1.start_time + timedelta(days=2)
        )
        eval_priya = Evaluation(
            submission_id=sub_priya_act3.id,
            evaluator_id=coord_user.id,
            total_score=27.0,
            max_score=30.0,
            feedback="Clean ROS 2 publisher-subscriber separation and stable hardware telemetry.",
            is_published=True,
            evaluated_at=act3.start_time + timedelta(days=2)
        )
        db.add_all([eval_alex, eval_priya])
        db.flush()

        crit_alex = [
            EvaluationCriterion(evaluation_id=eval_alex.id, name="Content & Technical Rigor", score=9.5, max_score=10.0, comments="Robust architecture"),
            EvaluationCriterion(evaluation_id=eval_alex.id, name="Presentation & Clarity", score=9.0, max_score=10.0, comments="Concise slides"),
            EvaluationCriterion(evaluation_id=eval_alex.id, name="Participation & Execution", score=10.0, max_score=10.0, comments="Active in Q&A")
        ]
        crit_priya = [
            EvaluationCriterion(evaluation_id=eval_priya.id, name="Content & Technical Rigor", score=9.0, max_score=10.0, comments="Accurate kinematics"),
            EvaluationCriterion(evaluation_id=eval_priya.id, name="Presentation & Clarity", score=9.0, max_score=10.0, comments="Great live demo"),
            EvaluationCriterion(evaluation_id=eval_priya.id, name="Participation & Execution", score=9.0, max_score=10.0, comments="On time deliverable")
        ]
        db.add_all(crit_alex + crit_priya)
        db.flush()

        # 10. Flagship Campus & Inter-Campus Events
        event1 = Event(
            title="Mirai InnovateX 2026: AI & Sustainability Flagship Hackathon",
            description="36-hour inter-campus collegiate hackathon building climate-tech, AI agent systems, and energy hardware.",
            campus_id=campus_blr.id,
            category="Hackathon",
            event_type="FLAGSHIP",
            venue="MST Central Innovation Quadrangle & Discord",
            start_time=now + timedelta(days=20),
            end_time=now + timedelta(days=22),
            registration_deadline=now + timedelta(days=15),
            max_participants=250,
            team_size_min=2,
            team_size_max=4,
            prize_pool="₹2,50,000 Cash + Cloud Credits",
            status="UPCOMING",
            banner_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80"
        )
        event2 = Event(
            title="International Conference on Autonomous Robotics & Cyber-Physical Systems (ICAR-2026)",
            description="Premier research symposium featuring keynotes from robotics researchers and student paper tracks.",
            campus_id=None, # Inter-campus
            category="Conference",
            event_type="INTER_CAMPUS",
            venue="Mirai Cyber Campus Auditorium, Hyderabad",
            start_time=now + timedelta(days=35),
            end_time=now + timedelta(days=37),
            registration_deadline=now + timedelta(days=25),
            max_participants=300,
            team_size_min=1,
            team_size_max=3,
            prize_pool="Best Paper Trophy & IEEE Publication Grants",
            status="UPCOMING",
            banner_url="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
        )
        db.add_all([event1, event2])
        db.flush()

        # Event Registrations
        reg_alex = EventRegistration(
            event_id=event1.id,
            user_id=student_alex.id,
            registered_at=now - timedelta(days=2),
            status="CONFIRMED"
        )
        reg_priya = EventRegistration(
            event_id=event1.id,
            user_id=student_priya.id,
            registered_at=now - timedelta(days=1),
            status="CONFIRMED"
        )
        db.add_all([reg_alex, reg_priya])
        db.flush()

        # 11. Verified Sample Certificate
        cert_num = "MST-CERT-2026-88201"
        cert_date = now - timedelta(days=10)
        cert_hash = compute_certificate_hash(
            cert_number=cert_num,
            user_id=student_alex.id,
            title="Venture Ideation & Edge AI Prototyping",
            cert_type="ACHIEVEMENT",
            issue_date_str=cert_date.strftime("%Y-%m-%d")
        )
        v_url = f"http://localhost:8000/verify/{cert_num}"
        pdf_path = generate_certificate_pdf(
            cert_number=cert_num,
            student_name=student_alex.full_name,
            student_id=student_alex.student_id,
            title="Venture Ideation & Edge AI Prototyping",
            cert_type="ACHIEVEMENT",
            issuer_name=advisor_user.full_name,
            issue_date=cert_date,
            verification_url=v_url
        )
        cert_record = Certificate(
            certificate_number=cert_num,
            user_id=student_alex.id,
            title="Venture Ideation & Edge AI Prototyping",
            cert_type="ACHIEVEMENT",
            issued_by=advisor_user.id,
            activity_id=act1.id,
            issue_date=cert_date,
            file_path=pdf_path,
            verification_hash=cert_hash,
            metadata_json={"score": 28.5, "club": "Nexcell — Entrepreneurship Club"}
        )
        db.add(cert_record)

        # 12. Initial Notifications
        notif1 = Notification(
            user_id=student_alex.id,
            title="Certificate Issued: Achievement Award",
            message="Your Certificate for 'Venture Ideation & Edge AI Prototyping' is verified and available for download.",
            notification_type="CERTIFICATE",
            link=f"/api/v1/certificates/download/{cert_record.id}"
        )
        notif2 = Notification(
            user_id=student_priya.id,
            title="Upcoming Club Day 3",
            message="Club Day 3 is scheduled for this Friday. Join your club's presentation track.",
            notification_type="INFO"
        )
        db.add_all([notif1, notif2])

        db.commit()

        print("\n✅ Mirai Clubs database seeded successfully!")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("🏛️ CAMPUSES (4):")
        print("  • MST-BLR: Mirai Main Campus - Tech City (Bangalore)")
        print("  • MST-NCR: Mirai North Campus - Innovation Hub (Noida)")
        print("  • MST-HYD: Mirai Cyber Campus - Tech Valley (Hyderabad)")
        print("  • MST-PUN: Mirai Western Campus - Engineering Park (Pune)")
        print(f"🎯 OFFICIAL CLUBS SEEDED ({len(seeded_clubs)}):")
        print("  1. Nexcell — Entrepreneurship Club (Entrepreneurship)")
        print("  2. Khel Society — Sports Club (Sports)")
        print("  3. Kaizen — Technology Club (Technology)")
        print("  4. Malhar — Cultural Club (Cultural)")
        print("👥 USER ACCOUNTS (Password: 'MiraiDemo#2026'):")
        print("  1. ADMIN:          admin@mirai.edu.in         (Dr. Vikram Sen)")
        print("  2. CAMPUS MANAGER: anita.manager@mirai.edu.in (Anita Desai - Bangalore)")
        print("  3. FACULTY ADVISOR:advisor.nair@mirai.edu.in  (Dr. Radha Nair)")
        print("  4. COORDINATOR:    rohan.coord@mirai.edu.in   (Rohan Sharma)")
        print("  5. STUDENT 1:      alex.chen@student.mirai.edu (Alex Chen - MST-2026-CS101)")
        print("  6. STUDENT 2:      priya.patel@student.mirai.edu (Priya Patel - MST-2026-EC204)")
        print("  7. STUDENT (ZERO): kavya.zero@student.mirai.edu  (Kavya Rao - Zero Participation)")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
