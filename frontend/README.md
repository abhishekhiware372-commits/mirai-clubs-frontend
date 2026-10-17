# MIRAI CLUBS — Club Activities Tracker Frontend
**Mirai School of Technology (MSOT)**  
**Student Challenge: Problem 5 — Centralized Club Activities Tracker**  
*Version: 1.0.0 (Production Release — Competition Edition)*

---

## 1. Project Overview
**MIRAI CLUBS** is the official collegiate digital campus portal engineered for Mirai School of Technology (MSOT) to manage student organizations, Club Day activity plans, rotating QR attendance sessions, deliverable rubric grading, and tamper-resistant co-curricular transcripts across 4 regional campuses.

Designed strictly around the **official Problem 5 specification**, this repository contains the exportable, standalone Next.js 14 frontend architecture with a centralized API integration layer prepared for connection to a FastAPI / PostgreSQL backend.

---

## 2. Key Features

- **Multi-Role Scoped Access Control (RBAC):**
  - Fully segregated dashboards, layouts, and route guards for all 5 sanctioned roles:
    1. `STUDENT`
    2. `STUDENT_COORDINATOR`
    3. `FACULTY_ADVISOR`
    4. `CAMPUS_MANAGER`
    5. `ADMIN` (Program Manager)
- **Official Club Day 6-Stage Workflow:**
  1. *7 Days Before:* Coordinator submits activity plan (topic, venue, deliverable specification, deadline). Faculty Advisor reviews, approves, or requests changes.
  2. *3 Days Before:* Automated member announcements dispatched across campus channels.
  3. *On Club Day:* Coordinator hosts 15-second rotating HMAC QR code session with 6-digit backup code fallback; marks presenters with instant merit credits.
  4. *Within 48 Hours:* Students upload deliverable artifacts (PDF, code repositories, zip archives).
  5. *Within 5 Days:* Coordinator and Faculty Advisor evaluate deliverables using standardized 3-part rubrics (Content, Presentation, Participation).
  6. *End of Month:* Institutional analytics, participation rate audits, and co-curricular credit ledger updates.
- **15-Second Rotating HMAC QR Attendance Engine:**
  - Dynamic time-based token generation mitigating screenshot sharing proxy abuse.
  - Grace window support for mobile network latency.
  - Camera malfunction code fallback.
  - Coordinator manual status override with mandatory justification and immutable audit logging.
- **Student-Owned Co-Curricular Transcript:**
  - Verifiable transcript document displaying club affiliations, activities attended, presenter credits, rubric scores, and cryptographic SHA-256 signatures.
  - Print / PDF export engine.
- **Flagship Campus Events Hub:**
  - Modules for *GAMBADE* (Inter-Campus Arts & Cultural Olympiad), *InnovateX Hackathon*, *ICAR International Conference*, and *Cross Road* venture pitch days.
  - Team formation and solo registration workflows.
- **Campus Manager Operations & Duty Leave:**
  - Zero-participation student cohort identification.
  - Inactive club alerts (>45 days without verified session).
  - Duty Leave grant workflow synchronizing co-curricular event participation with academic attendance records.

---

## 3. Technology Stack

- **Framework:** Next.js 14 (App Router, Server & Client Components)
- **UI Library:** React 18
- **Language:** TypeScript 5 (Strict Mode enabled)
- **Styling:** Tailwind CSS 3.4 (Custom deep navy foundation `#090d16`, cyan/violet accents)
- **Icons:** Lucide React
- **HTTP Layer:** Centralized Fetch Client with JWT injection and isolated fallback repository
- **Fonts:** System Sans & JetBrains Mono

---

## 4. Folder Structure

```
mirai-clubs-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML & Toast/Auth Providers
│   │   ├── page.tsx                # Dynamic role redirector
│   │   ├── globals.css             # Tailwind base & print rules
│   │   ├── login/page.tsx          # JWT Auth, Google Workspace SSO & Judge Role Switcher
│   │   ├── register/page.tsx       # Student enrollment
│   │   ├── unauthorized/page.tsx   # Role boundary restriction
│   │   ├── student/                # Student portal routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── clubs/page.tsx
│   │   │   ├── clubs/[id]/page.tsx
│   │   │   ├── club-day/page.tsx
│   │   │   ├── attendance/page.tsx
│   │   │   ├── events/page.tsx
│   │   │   ├── submissions/page.tsx
│   │   │   ├── certificates/page.tsx
│   │   │   ├── transcript/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── coordinator/            # Mobile-optimized coordinator routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── attendance/page.tsx
│   │   │   ├── club-day/page.tsx
│   │   │   ├── requests/page.tsx
│   │   │   ├── clubs/page.tsx
│   │   │   ├── submissions/page.tsx
│   │   │   ├── evaluations/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── advisor/                # Faculty advisor governance
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── activities/page.tsx
│   │   │   ├── evaluations/page.tsx
│   │   │   ├── certificates/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── campus-manager/         # Regional campus operations
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── clubs/page.tsx
│   │   │   ├── events/page.tsx
│   │   │   └── reports/page.tsx
│   │   └── admin/                  # University-wide dean administration
│   │       ├── dashboard/page.tsx
│   │       ├── clubs/page.tsx
│   │       ├── campuses/page.tsx
│   │       ├── events/page.tsx
│   │       ├── reports/page.tsx
│   │       └── users/page.tsx
│   ├── components/
│   │   ├── ui/                     # Button, Badge, Card, StatCard, Modal, Tabs, Skeleton
│   │   ├── layout/                 # AppHeader, RoleSidebar, MobileNav, DemoRoleBar
│   │   └── shared/                 # QRAttendanceHost, QRAttendanceScanner, RubricEvaluator,
│   │                               # ClubDayTimeline, TranscriptView, CertificatePreviewModal
│   ├── context/
│   │   ├── AuthContext.tsx         # Session state, JWT storage, role redirect
│   │   └── ToastContext.tsx        # Non-blocking reactive alert system
│   └── lib/
│       ├── api/                    # CENTRALIZED SERVICE LAYER (Separated from UI)
│       │   ├── types.ts            # Official Domain Types
│       │   ├── client.ts           # Fetch client with Authorization Bearer injection
│       │   ├── auth.ts             # Authentication service
│       │   ├── clubs.ts            # Clubs & membership requests service
│       │   ├── activities.ts       # Club Day 7-day workflow service
│       │   ├── attendance.ts       # 15s rotating HMAC QR attendance service
│       │   ├── events.ts           # Competitions & team registration service
│       │   ├── submissions.ts      # Deliverables service
│       │   ├── evaluations.ts      # Rubric grading service
│       │   ├── certificates.ts     # Cryptographic certificate issuance & verification
│       │   ├── reports.ts          # Institutional analytics & CSV export service
│       │   ├── notifications.ts    # Notification center service
│       │   ├── mockData.ts         # ISOLATED test repository (No scattered component mocks)
│       │   └── index.ts
│       └── utils.ts                # Formatting and class merging helpers
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.mjs
├── .env.example
└── README.md
```

---

## 5. Environment Variables

Create a local `.env.local` file by copying `.env.example`:

```bash
cp .env.example .env.local
```

### Configuration Parameters:
```env
# Backend Base API URL (FastAPI endpoints)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Operation Mode: Set 'true' for standalone offline evaluation; 'false' to connect to live FastAPI
NEXT_PUBLIC_USE_MOCK=false

# Institutional Metadata
NEXT_PUBLIC_CAMPUS_NAME="Mirai School of Technology"
NEXT_PUBLIC_SYSTEM_VERSION="1.0.0-MSOT-CHALLENGE"
```

---

## 6. Local Setup & Execution

### Prerequisites
- Node.js (v18.17.0 or v20+)
- npm (v9+) or pnpm

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
The application will launch at: `http://localhost:3000`

### Step 3: Production Build
```bash
npm run build
npm run start
```

---

## 7. Official Test Accounts & Roles

To facilitate immediate testing by competition judges, official seed accounts are available:

| Role | Name | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Dr. Vikram Sen | `admin@mirai.edu.in` | `MiraiDemo#2026` | University-wide Registry |
| **CAMPUS_MANAGER** | Anita Desai | `anita.manager@mirai.edu.in` | `MiraiDemo#2026` | Bangalore Tech City Campus |
| **FACULTY_ADVISOR**| Dr. Radha Nair | `advisor.nair@mirai.edu.in` | `MiraiDemo#2026` | Nexcell & Kaizen Advisor |
| **STUDENT_COORDINATOR**| Rohan Sharma | `rohan.coord@mirai.edu.in`| `MiraiDemo#2026` | Nexcell Coordinator |
| **STUDENT** | Alex Chen | `alex.chen@student.mirai.edu`| `MiraiDemo#2026`| 2nd Year CSE (Primary: Nexcell) |

> **Judge Tip:** Use the top **Institutional Demo Role Switcher Bar** on any screen to switch between all five role perspectives with a single click.

---

## 8. Backend API Integration Specifications

All frontend services communicate via `src/lib/api/` matching standard FastAPI endpoints:

| Endpoint | Method | Role Access | Purpose |
| :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | Public | Obtains JWT access token and user payload |
| `/auth/google-login` | `POST` | Public | Validates institutional Google OAuth token |
| `/clubs` | `GET`, `POST` | All / Admin | Lists clubs, sanctions new clubs |
| `/clubs/{id}/join` | `POST` | Student | Submits primary or secondary join request |
| `/memberships/requests` | `GET` | Coordinator | Fetches pending membership applications |
| `/activities` | `GET`, `POST` | All / Coordinator | Fetches and creates 7-day activity plans |
| `/activities/{id}/review` | `POST` | Faculty Advisor | Approves or requests changes with comments |
| `/attendance/session/create`| `POST` | Coordinator | Starts 45-min session with 15s rotation |
| `/attendance/session/{id}/current-qr` | `GET` | Coordinator | Polls current rotating HMAC token & backup code |
| `/attendance/check-in` | `POST` | Student | Verifies student token / backup code |
| `/attendance/record/{id}/correct` | `POST` | Coordinator | Logs audited attendance change with justification |
| `/submissions/upload` | `POST` | Student | Ingests deliverable artifact within 48h |
| `/evaluations` | `POST` | Advisor / Coord | Grades deliverable with multi-part rubric |
| `/certificates/verify/{no}` | `GET` | Public | Validates cryptographic SHA-256 fingerprint |
| `/reports/export` | `GET` | Staff / Admin | Generates institutional CSV/audit export |

---

## 9. Security & Production Quality Standards

1. **No Embedded Secrets:** Zero API keys, database credentials, or private salts are hardcoded.
2. **Honest Status Responses:** When backend endpoints fail or reject invalid QR tokens, explicit error states and reasons are surfaced without fake success toasts.
3. **Audit Trail Immutability:** Any administrative correction requires a mandatory explanation that is permanently recorded.
4. **Export Readiness:** Fully compliant standard Next.js application that builds cleanly with zero TypeScript errors.
