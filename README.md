# MIRAI CLUBS — Club Activities Tracker
### Mirai School of Technology (MSOT) | Problem 5 Challenge Solution

[![Build Status](https://img.shields.io/badge/tests-19%20passed-brightgreen)](TEST_REPORT.md)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-teal.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

A centralized, database-backed platform managing the complete co-curricular club lifecycle across multiple campuses at Mirai School of Technology. Fulfilling all three core requirements of the MSOT Problem 5 Challenge:

1. **Verified Participation** — 15-second rotating cryptographic QR attendance, rubric evaluations, and immutable audit trails.
2. **Low Coordinator Effort** — Mobile-first bottom navigation bar, one-click membership approval/rejection, single-tap QR broadcast.
3. **Student-Owned Records** — Downloadable, SHA-256 verified PDF transcripts and publicly verifiable certificates at `/verify/{cert_number}`.

---

## 🎯 Official Clubs (Strictly 4)

Per MSOT institutional policy, exactly **four official clubs** are registered across four campuses. The API enforces this with HTTP 400 on any attempt to create a 5th.

| Club | Category | Campus |
| :--- | :--- | :--- |
| **Nexcell — Entrepreneurship Club** | Entrepreneurship | Bangalore (MST-BLR) |
| **Khel Society — Sports Club** | Sports | Bangalore (MST-BLR) |
| **Kaizen — Technology Club** | Technology | Noida (MST-NCR) |
| **Malhar — Cultural Club** | Cultural | Pune (MST-PUN) |

---

## 🏛️ Four Official Campuses

| Code | Campus |
| :--- | :--- |
| MST-BLR | Mirai Main Campus — Tech City (Bangalore) |
| MST-NCR | Mirai North Campus — Innovation Hub (Noida) |
| MST-HYD | Mirai Cyber Campus — Tech Valley (Hyderabad) |
| MST-PUN | Mirai Western Campus — Engineering Park (Pune) |

---

## 👥 Five Required User Roles & Demo Credentials

All test accounts share the universal demo password: **`MiraiDemo#2026`**

| Role | Name | Email | Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin / Program Manager** | Dr. Vikram Sen | `admin@mirai.edu.in` | `#dashboard-admin` |
| **Campus Manager** | Anita Desai | `anita.manager@mirai.edu.in` | `#dashboard-campus-manager` |
| **Faculty Advisor** | Dr. Radha Nair | `advisor.nair@mirai.edu.in` | `#dashboard-advisor` |
| **Student Coordinator** | Rohan Sharma | `rohan.coord@mirai.edu.in` | `#dashboard-coordinator` |
| **Student** | Alex Chen | `alex.chen@student.mirai.edu` | `#dashboard-student` |
| **Student 2** | Priya Patel | `priya.patel@student.mirai.edu` | `#dashboard-student` |

> **Security:** Unregistered Google emails are strictly rejected with **HTTP 403** and a message directing users to contact the Dean of Student Affairs or Campus Administrator. No automatic account creation.

---

## 🚀 Quick Start & Deployment

### Option 1: One-Command Docker Setup (Recommended)
```bash
docker compose up --build
```
Access at:
- **Web App:** [http://localhost:8000](http://localhost:8000)
- **Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Option 2: Local Python Development Setup
```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed database with official clubs, campuses, and all 5 demo roles
cd backend && python seed.py && cd ..

# 4. Start FastAPI backend
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 5. Serve frontend (open frontend/index.html in browser, or use a file server)
# The frontend auto-connects to http://localhost:8000
```

---

## 🧪 Test Suite Results (19/19 Passed)

```bash
# Run the full test suite
pytest backend/tests/ -v

# Run the load/concurrency benchmark
python backend/tests/load_test.py
```

**Test Matrix:**

| Suite | Tests | Result |
| :--- | :---: | :---: |
| `test_all_workflows.py` | 12 | ✅ 12/12 PASSED |
| `test_official_problem5_suite.py` | 7 | ✅ 7/7 PASSED |
| **Total** | **19** | **✅ 19/19 PASSED** |

**Concurrency Benchmark (0% error rate, all runs):**

| Concurrent Check-Ins | Throughput | p50 | p95 | Target | Status |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 100 | 306 req/s | 95 ms | **256 ms** | <1000 ms | ✅ PASS |
| 300 | 366 req/s | 93 ms | **227 ms** | <1000 ms | ✅ PASS |
| 500 | 378 req/s | 97 ms | **258 ms** | <1000 ms | ✅ PASS |

---

## 🏗️ Architecture

```
mirai-clubs/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST API routes (auth, clubs, activities, attendance...)
│   │   ├── models/entities.py  # SQLAlchemy ORM models
│   │   ├── schemas/schemas.py  # Pydantic request/response schemas
│   │   ├── services/           # PDF certificates, QR tokens, transcripts
│   │   └── main.py             # FastAPI app entry point
│   ├── seed.py                 # Database seeder (4 clubs, 4 campuses, all 5 roles)
│   └── tests/                  # Pytest suites + load benchmark
└── frontend/                   # Modern Next.js 14 / TypeScript / Tailwind CSS App
    ├── src/
    │   ├── app/                # App Router (Student, Coordinator, Advisor, Campus Mgr, Admin)
    │   ├── components/         # Reusable UI & Problem 5 shared modules (QR, rubrics, timeline)
    │   ├── context/            # AuthContext (5 RBAC roles) & ToastContext
    │   └── lib/api/            # Centralized API service layer & isolated test fixtures
    ├── package.json            # Scripts: dev, build, start, lint
    ├── tailwind.config.js      # Deep navy + cyan/violet design tokens
    └── tsconfig.json           # TypeScript configuration
```

**Full Stack:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · FastAPI · SQLAlchemy 2 · SQLite / PostgreSQL 16 · ReportLab PDFs · 15s HMAC QR tokens

---

## 🔐 Security & Integrity

- **JWT Bearer tokens** — HS256 signed, 7-day expiry
- **Role guards** — Every protected endpoint enforces `require_role()` dependency
- **15s rotating QR** — HMAC-SHA256 tokens invalidate on rotation; replay attacks are blocked
- **Attendance audit trail** — Any correction includes coordinator ID, timestamp, and mandatory reason
- **Certificate tamper detection** — SHA-256 hash is recomputed on every `/verify/{cert_number}` call; `tamper_detected: true` if any field changes
- **4-club hard limit** — Enforced at API layer (`HTTP 400`) and cannot be bypassed

---

## 📋 Verified Feature Checklist

| Feature | Status |
| :--- | :---: |
| Club Registry (4 official clubs, multi-campus) | ✅ |
| Student Membership Request & Coordinator Approval | ✅ |
| 7-Day Club Day Planning & Faculty Advisor Sign-off | ✅ |
| 15s Rotating HMAC QR Code Attendance | ✅ |
| Attendance Audit Correction (with immutable reason) | ✅ |
| Student Deliverable Submissions (file upload) | ✅ |
| 3-Criterion Rubric Evaluation (Content, Presentation, Participation) | ✅ |
| Real PDF Certificates with SHA-256 Tamper Detection | ✅ |
| Public Certificate Verification URL (`/verify/{cert_number}`) | ✅ |
| Downloadable Co-Curricular Transcript PDF | ✅ |
| Events & Team Formation with Capacity Limits | ✅ |
| Role-Based Access Control (5 roles enforced at API) | ✅ |
| Dedicated Dashboard per Role (Student/Coordinator/Advisor/Manager/Admin) | ✅ |
| Inactive Clubs Compliance Watchlist (30-day threshold) | ✅ |
| Zero-Participation Student Registry | ✅ |
| Top Contributors Leaderboard (weighted points) | ✅ |
| Monthly Club Health Audit Inspector | ✅ |
| Academic CSV Exports (clubs, attendance, inactive clubs) | ✅ |
| Mobile Responsive + Bottom Navigation Bar | ✅ |
| Unregistered Google Login Rejection (HTTP 403) | ✅ |
| Notifications System (bell icon, mark all read) | ✅ |
| Academic Calendar Import (CSV) | ✅ |

---

*MIRAI CLUBS — Built for the MSOT Problem 5 Hackathon Challenge. All test numbers reflect actual executed benchmark outputs.*
