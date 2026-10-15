import time
import os
import sys
import math
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.db.session import SessionLocal
from app.models.entities import User, Activity, QRSession, Attendance
from app.services.qr_service import generate_qr_token, get_time_step
from app.core.security import get_password_hash, create_access_token

def run_load_test(concurrency_levels=[100, 300, 500]):
    print("=" * 70)
    print(" 🚀 MIRAI CLUBS — ATTENDANCE CHECK-IN CONCURRENCY & LATENCY BENCHMARK")
    print("=" * 70)

    client = TestClient(app)
    db = SessionLocal()

    # 1. Setup Activity & QR Session
    act = db.query(Activity).filter(Activity.status.in_(["APPROVED", "COMPLETED"])).first()
    if not act:
        print("No active activity found for benchmark.")
        return

    qr_sess = db.query(QRSession).filter(QRSession.activity_id == act.id, QRSession.is_active == True).first()
    if not qr_sess:
        # Create one
        from datetime import datetime, timedelta
        qr_sess = QRSession(
            activity_id=act.id,
            created_by=act.created_by,
            secret_key="bench_secret_key_12345",
            valid_from=datetime.utcnow(),
            valid_until=datetime.utcnow() + timedelta(hours=2),
            rotation_interval_seconds=15,
            is_active=True
        )
        db.add(qr_sess)
        db.commit()
        db.refresh(qr_sess)

    # 2. Pre-generate mock students and tokens to test pure check-in latency
    max_students = max(concurrency_levels)
    print(f"Preparing {max_students} test student identities for concurrent check-in benchmark...")
    
    test_students = []
    tokens = []
    pwd = get_password_hash("Test#2026")
    
    # Check existing benchmark students
    existing_students = db.query(User).filter(User.email.like("bench_student_%@mirai.edu")).all()
    existing_count = len(existing_students)
    
    needed = max_students - existing_count
    if needed > 0:
        new_users = []
        for i in range(existing_count, max_students):
            u = User(
                email=f"bench_student_{i}@mirai.edu",
                hashed_password=pwd,
                full_name=f"Bench Student {i}",
                student_id=f"MST-BENCH-{i:04d}",
                role="STUDENT",
                is_active=True,
                is_verified=True
            )
            new_users.append(u)
        db.add_all(new_users)
        db.commit()

    act_id = str(act.id)
    qr_secret = str(qr_sess.secret_key)
    all_bench_students = db.query(User).filter(User.email.like("bench_student_%@mirai.edu")).all()
    user_tokens = {u.id: create_access_token(u.id, "STUDENT") for u in all_bench_students[:max_students]}

    db.close()

    results_summary = []

    for count in concurrency_levels:
        print(f"\n--- Testing Concurrency Level: {count} Concurrent Student Check-Ins ---")
        
        # Clear attendances for benchmark students for clean run
        db_clean = SessionLocal()
        student_ids = [u.id for u in all_bench_students[:count]]
        db_clean.query(Attendance).filter(
            Attendance.activity_id == act_id,
            Attendance.user_id.in_(student_ids)
        ).delete(synchronize_session=False)
        db_clean.commit()
        db_clean.close()

        step = get_time_step()
        token = generate_qr_token(qr_secret, step)

        latencies = []
        successes = 0
        failures = 0

        def perform_checkin(user_id):
            jwt_token = user_tokens[user_id]
            start = time.time()
            try:
                res = client.post(
                    "/api/v1/attendance/check-in",
                    json={"activity_id": act_id, "token": token},
                    headers={"Authorization": f"Bearer {jwt_token}"}
                )
                elapsed = time.time() - start
                is_ok = res.status_code == 200 and res.json().get("status") in ("SUCCESS", "LATE_CHECK_IN")
                return elapsed, is_ok
            except Exception:
                return time.time() - start, False

        start_time = time.time()
        with ThreadPoolExecutor(max_workers=min(count, 50)) as executor:
            futures = [executor.submit(perform_checkin, uid) for uid in student_ids]
            for f in as_completed(futures):
                lat, ok = f.result()
                latencies.append(lat)
                if ok:
                    successes += 1
                else:
                    failures += 1

        total_duration = time.time() - start_time
        latencies_ms = sorted([x * 1000.0 for x in latencies])
        def get_pct(p):
            idx = min(len(latencies_ms) - 1, max(0, int(math.ceil((p / 100.0) * len(latencies_ms)) - 1)))
            return latencies_ms[idx]
        p50 = get_pct(50)
        p95 = get_pct(95)
        p99 = get_pct(99)
        error_rate = (failures / count) * 100.0

        # Verify database write count
        db_check = SessionLocal()
        persisted_writes = db_check.query(Attendance).filter(
            Attendance.activity_id == act_id,
            Attendance.user_id.in_(student_ids)
        ).count()
        db_check.close()

        print(f" Total Requests:       {count}")
        print(f" Successful Writes:    {successes} (DB Persisted: {persisted_writes})")
        print(f" Failed Requests:      {failures} (Error Rate: {error_rate:.2f}%)")
        print(f" Total Wall Duration:  {total_duration:.2f}s")
        print(f" Throughput:           {count / total_duration:.1f} req/sec")
        print(f" Median Latency (p50): {p50:.2f}ms")
        print(f" 95th Pctl (p95):      {p95:.2f}ms (Target: <1000ms - {'PASS ✅' if p95 < 1000 else 'FAIL ❌'})")
        print(f" 99th Pctl (p99):      {p99:.2f}ms")

        results_summary.append({
            "concurrency": count,
            "successes": successes,
            "failures": failures,
            "error_rate": error_rate,
            "p50_ms": p50,
            "p95_ms": p95,
            "p99_ms": p99,
            "throughput_rps": count / total_duration,
            "db_writes": persisted_writes
        })

    print("\n" + "=" * 70)
    print(" 🏁 LOAD TEST BENCHMARK COMPLETE — ALL TARGETS EVALUATED")
    print("=" * 70)
    return results_summary

if __name__ == "__main__":
    run_load_test()
