# MIRAI CLUBS — System Design Document
**Product:** Centralized Club Activities Tracker  
**Institution:** Mirai School of Technology (MSOT)  
**Standard:** Problem 5 Challenge Specification  
**Version:** 1.0.0 (Production Release — October 15, 2026)  

---

## 1. System Architecture & Component Overview

Mirai Clubs is engineered as a robust, low-latency, database-backed university platform managing the complete co-curricular lifecycle across 4 regional campuses and **4 officially sanctioned student organizations** (strict institutional limit enforced at API and database boundary).

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Responsive Web)"]
        Browser["Mobile & Desktop Web UI<br>(Vanilla JS, Tailwind CSS, Lucide Icons)"]
    end

    subgraph ServiceLayer ["Application & API Service (FastAPI)"]
        AuthSvc["Auth & RBAC Service<br>(JWT, Bcrypt, Role Scoping)"]
        QRSvc["15s Rotating HMAC Engine<br>(Anti-Proxy Token Generation)"]
        CertSvc["ReportLab PDF & QR Engine<br>(Cryptographic SHA-256 Signatures)"]
        AuditSvc["Audit & Correction Engine<br>(Immutable Override Logs)"]
        ReportSvc["Reporting & Analytics Engine<br>(SQL Aggregation & CSV Exports)"]
    end

    subgraph PersistenceLayer ["Persistence Layer"]
        Postgres[("PostgreSQL 16 / SQLite Engine<br>4 Official Clubs, 4 Campuses, 5 Roles")]
        Storage[("Local / Cloud Object Storage<br>PDF Certificates & Deliverables")]
    end

    Browser <-->|REST API / HTTPS| AuthSvc
    Browser <-->|15s Polling / Scan| QRSvc
    Browser <-->|Download / Verify| CertSvc
    AuthSvc --> Postgres
    QRSvc --> Postgres
    CertSvc --> Postgres
    CertSvc --> Storage
    AuditSvc --> Postgres
    ReportSvc --> Postgres
```

### Core Architecture Principles:
1. **Verified Participation:** Every student credit requires a dual-factor verifiable trail (cryptographic check-in, submission artifact, or faculty evaluation).
2. **Low Coordinator Effort:** Coordinators manage sessions from mobile devices with automated 15-second rotating QR codes, single-tap presenter recognition, and rapid check-in verification.
3. **Student-Owned Records:** Real-time generation of digitally signed PDF transcripts and tamper-resistant certificates.

---

## 2. Core Workflows

### 2.1 Rotating QR Attendance Engine
```mermaid
sequenceDiagram
    autonumber
    actor C as Student Coordinator
    participant S as FastAPI Server
    actor St as Student
    participant DB as Database (PostgreSQL)

    C->>S: POST /attendance/session/create (45 min duration, 15s window)
    S->>DB: Store session secret & window parameters
    loop Every 15 Seconds
        C->>S: GET /attendance/session/{id}/current-qr
        S->>S: Compute Token = HMAC_SHA256(SessionSecret, WindowIndex)
        S-->>C: Return base64 QR Image & 10-char Token
    end
    St->>S: POST /attendance/check-in (Token, ActivityId)
    S->>S: Verify Token matches WindowIndex (±1 grace period)
    S->>DB: Record Attendance (Status=PRESENT, Method=QR_SCAN)
    S-->>St: HTTP 200 (Verified On-Time)
```

- **Anti-Proxy Protection:** Screenshot sharing fails because tokens rotate every 15 seconds. Expired tokens are rejected immediately.
- **Grace Window:** ±1 window period is supported to accommodate network latency on campus mobile connections.
- **Manual Overrides:** Any manual status change creates an immutable `AttendanceAudit` record containing supervisor ID, previous status, new status, and mandatory justification text.

### 2.2 Certificate Issuance & Public Verification
1. **Issuance:** Faculty Advisors award achievement or completion certificates. The backend calculates a cryptographic fingerprint:
   $$\text{Hash} = \text{SHA256}(\text{CertNumber} \parallel \text{StudentID} \parallel \text{IssueDate} \parallel \text{SecretKey})$$
2. **PDF Generation:** Using `reportlab`, a high-resolution certificate is generated with institutional styling, registrar signatures, and an embedded QR code linking to `/verify/{cert_number}`.
3. **Verification:** Any external employer or university can scan the QR code. The server recalculates the SHA-256 hash against database attributes to detect tampering.

---

## 3. Security Architecture & RBAC

The platform implements strict Role-Based Access Control across five distinct user roles:

| Role | Scope | Permitted Capabilities | Restricted Operations |
| :--- | :--- | :--- | :--- |
| **Admin** | University-wide | Full system settings, user roles, global events, all campus reports | None |
| **Campus Manager** | Campus-specific | Review campus clubs, view campus participation, review monthly club health, approve duty leave | Cannot alter platform settings or other campuses |
| **Faculty Advisor** | Assigned Club | Review/approve 7-day activity plans, grade deliverables with rubrics, issue certificates | Cannot plan sessions or alter user credentials |
| **Student Coordinator** | Assigned Club | Plan Club Day activities, host live rotating QR sessions, mark presenters, log audited corrections | Cannot approve own plans or grade deliverables |
| **Student** | Self | Browse 30+ clubs, request up to 2 memberships, scan check-in, submit files, download verified transcript | Cannot access staff views or modify records |

### Identity & Data Security:
- **Authentication:** Stateless JSON Web Tokens (JWT) using `HS256` with configurable expiry (8 hours). Passwords salted and hashed via `bcrypt`.
- **Authorization Enforcement:** FastAPI dependencies (`require_role`, `require_campus_manager_or_above`, `require_coordinator_of_club`) validate role claims on every protected endpoint.
- **Storage Protection:** File uploads (deliverables, reports) are sanitized to prevent directory traversal and validated against MIME-type allowlists.

---

## 4. Database Schema Design

The relational schema is normalized with foreign key constraints and indexed lookup paths:

```mermaid
erDiagram
    Campus ||--o{ Club : "hosts"
    Campus ||--o{ User : "registers"
    User ||--o{ ClubMembership : "enrols in"
    Club ||--o{ ClubMembership : "admits"
    Club ||--o{ Activity : "schedules"
    Activity ||--o{ Attendance : "records"
    Activity ||--o{ Submission : "requires"
    User ||--o{ Attendance : "checks in"
    User ||--o{ Submission : "uploads"
    Submission ||--o{ Evaluation : "graded by"
    Event ||--o{ EventRegistration : "accepts"
    Event ||--o{ EventTeam : "hosts"
    User ||--o{ Certificate : "awarded to"
    Attendance ||--o{ AttendanceAudit : "audited by"
```

### Key Data Constraints:
- `uq_club_member`: Unique index on `(club_id, user_id)` preventing duplicate club enrollments.
- `uq_activity_user_attendance`: Unique constraint on `(activity_id, user_id)` preventing duplicate check-ins.
- `uq_event_user_registration`: Unique constraint on `(event_id, user_id)` preventing double-registration.
- `max_participants`: Enforced transactional check preventing event over-subscription.

---

## 5. Failure Modes & Self-Healing Resilience

1. **Database Fallback:** If local PostgreSQL is unavailable (e.g. sandbox or edge deployments), the database layer automatically initializes an embedded SQLite instance (`mirai_clubs.db`) with identical schema structures.
2. **Network Drops during QR Check-In:** The 15-second rotation engine supports a trailing 1-window grace period, allowing students experiencing up to 15 seconds of latency to complete check-in without failure.
3. **Concurrency Spikes:** Database transactions utilize row-level locking during registration and check-in to prevent race conditions during high-volume campus events.
