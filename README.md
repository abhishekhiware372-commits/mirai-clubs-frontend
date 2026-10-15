# MIRAI CLUBS — Club Activities Tracker
### Mirai School of Technology (MSOT) | Problem 5 Challenge Solution

[![Build Status](https://img.shields.io/badge/tests-17%20passed-emerald)](TEST_REPORT.md)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-teal.svg)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

A centralized, database-backed platform managing the complete co-curricular club lifecycle across multiple campuses at Mirai School of Technology. Designed to fulfill all three core requirements of the MSOT Problem 5 Challenge:
1. **Verified Participation:** Dual-factor attendance, rubric evaluations, and cryptographic audit trails.
2. **Low Coordinator Effort:** Mobile-first 15-second rotating QR check-in and one-touch presenter recognition.
3. **Student-Owned Records:** Downloadable, digitally verified PDF transcripts and public certificate verification.

---

## 🏛️ Multi-Campus Scope & Seeded Data

Mirai Clubs is pre-configured with **4 official campuses** and **32 active clubs**:
- **MST-BLR:** Mirai Main Campus — Tech City (Bangalore) [8 Clubs]
- **MST-NCR:** Mirai North Campus — Innovation Hub (Noida) [8 Clubs]
- **MST-HYD:** Mirai Cyber Campus — Tech Valley (Hyderabad) [8 Clubs]
- **MST-PUN:** Mirai Western Campus — Engineering Park (Pune) [8 Clubs]

Categories covered: *Technical & Coding, Robotics & Hardware, Entrepreneurship, Design & Creative Arts, Social Impact, Literary & Debate, Sports & Fitness, Music & Cultural.*

---

## 👥 Five Required User Roles & Demo Credentials

All test accounts share the universal demo password: `MiraiDemo#2026`

| Role | Name | Email | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Admin** | Dr. Vikram Sen | `admin@mirai.edu.in` | Global multi-campus oversight, user role assignments, system-wide exports |
| **Campus Manager** | Anita Roy | `anita.manager@mirai.edu.in` | Bangalore campus clubs review, inactive clubs monitoring, duty leave |
| **Faculty Advisor** | Dr. Radha Nair | `advisor.nair@mirai.edu.in` | Activity plan approval, deliverable rubric grading, certificate issuance |
| **Student Coordinator** | Rohan Sharma | `rohan.coord@mirai.edu.in` | Entrepreneurship Club planning, 15s rotating QR sessions, presenters |
| **Student 1** | Alex Chen | `alex.chen@student.mirai.edu` | Primary club enrolment, QR check-in, submissions, PDF transcript |
| **Student 2** | Priya Patel | `priya.patel@student.mirai.edu` | Multi-club member, hackathon team lead, certificate recipient |
| **Student (Zero)** | Kavya Rao | `kavya.zero@student.mirai.edu` | Zero-participation baseline test account for advisor outreach |

---

## 🚀 Quick Start & Deployment

### Option 1: One-Command Docker Setup (Recommended)
Launch the entire system (PostgreSQL 16 database, FastAPI backend, and frontend) with a single command:
```bash
docker compose up --build
```
Access the application at:
- **Web App (Frontend & Role Switcher):** [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc UI:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Option 2: Local Python Environment Setup
1. **Activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Seed the database (Populates campuses, 32 clubs, sessions, and demo accounts):**
   ```bash
   python backend/seed.py
   ```
3. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --app-dir backend --reload --port 8000
   ```
4. **Open your browser:** Navigate to `http://localhost:8000`.

---

## 🧪 Testing & Verification

### 1. Run Automated Pytest Suite (17 Tests)
Execute the complete quality assurance suite covering end-to-end multi-club workflows, attendance integrity, 20-certificate tamper detection, 200 event registrations, RBAC, and PDF generation:
```bash
pytest backend/tests -v
```
**Current Status:** `17 passed in 7.81s`

### 2. Run High-Concurrency Load Benchmark (100, 300, 500 Check-Ins)
Benchmark the attendance check-in engine under peak load (target: $p95 < 1000\text{ ms}$):
```bash
python backend/tests/load_test.py
```
**Actual Benchmark Results:**
- **100 Concurrent:** $p95 = 202.09\text{ ms}$, Throughput = 302.5 req/s, Error rate = 0.00%
- **300 Concurrent:** $p95 = 293.12\text{ ms}$, Throughput = 387.3 req/s, Error rate = 0.00%
- **500 Concurrent:** $p95 = 262.96\text{ ms}$, Throughput = 380.8 req/s, Error rate = 0.00%

---

## 🛠️ Key Architectural Features

1. **Rotating QR Code Attendance Engine:**
   - 15-second HMAC-SHA256 time-based rotating tokens.
   - Prevents screenshot proxy check-ins across messaging apps.
   - Includes ±1 window grace period for campus network fluctuations.
   - Single-tap coordinator screen marking session presenters and on-the-spot recognition.
   - Audited manual correction overrides with mandatory justification logging.
2. **Co-Curricular PDF Transcripts:**
   - High-fidelity PDF generation using Python `reportlab`.
   - Comprehensive transcript ledger: enrolled clubs, session attendances, graded deliverables, rubric scores, and event honors.
   - Embedded public verification QR code and SHA-256 digital integrity stamp.
3. **Public Certificate Verification Portal:**
   - Real-time cryptographic validation via `/verify/{cert_number}`.
   - Detects database tampering or altered certificate metadata.
4. **Institutional Analytics & CSV Exports:**
   - Inactive clubs compliance monitor (flags clubs with 0 sessions in 30 days).
   - Zero-participation student watchlist for proactive faculty outreach.
   - Weighted student engagement leaderboard.
   - One-click RFC 4180 CSV exports for clubs, attendance, and compliance reports.

---

## 📂 Repository Structure

```
mirai-clubs/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST route handlers (auth, clubs, attendance, reports)
│   │   ├── core/            # JWT security, config, and settings
│   │   ├── db/              # SQLAlchemy session and engine setup
│   │   ├── models/          # Relational entities (User, Club, Activity, etc.)
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   └── services/        # PDF transcript and certificate generators
│   ├── tests/
│   │   ├── test_all_workflows.py            # Workflow integration tests
│   │   ├── test_official_problem5_suite.py  # 7 official Problem 5 challenge tests
│   │   └── load_test.py                     # 500-user concurrency benchmark
│   └── seed.py              # Multi-campus database seeder
├── frontend/
│   ├── css/styles.css       # Custom design system & animations
│   ├── js/api.js            # Centralized asynchronous API client
│   ├── js/app.js            # Single-page UI router & state controller
│   └── index.html           # Main responsive web portal
├── docker-compose.yml       # Production Docker multi-container specification
├── Dockerfile               # Python 3.9 production container
├── DESIGN_DOCUMENT.md       # Architectural specification & Mermaid diagrams
├── TEST_REPORT.md           # Comprehensive 8-area QA test report
└── requirements.txt         # Frozen Python dependencies
```

---

## 📜 Compliance & Honor Code

This project was built strictly to satisfy MSOT Problem 5 requirements. All reported metrics, benchmarks, and test assertions are reproducible via the commands provided above.
