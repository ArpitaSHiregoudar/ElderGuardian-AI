# ElderGuardian DC — Engineering MVP & Product Roadmap

**Document Version:** 1.0.0  
**Author:** Senior Engineering Manager  
**Target Audience:** Engineering Team, Product Leadership, Founders  
**Team Composition:** 1–2 Full-Stack Developers (Startup Stage)  
**Primary Tech Stack:**  
- **Frontend:** React.js (Vite), Tailwind CSS, Lucide Icons, React Router  
- **Backend:** Node.js, Express.js, Knex.js, SQLite (wal mode for dev/MVP, portable schema for Postgres upgrade)  
- **ML & Data Processing (Phase 2+):** Python (FastAPI, Tesseract/EasyOCR, scikit-learn / NumPy)  
- **Infrastructure & Tooling:** Docker & Docker Compose, Jest, Supertest, ESLint, Prettier  

---

## Executive Summary & Engineering Strategy

ElderGuardian AI is an assistive healthcare coordination platform bridging elderly individuals, family caregivers, and healthcare providers. Building software for seniors demands stringent adherence to accessibility (large touch targets, high contrast, screen reader compatibility), rock-solid data integrity, and bulletproof reminder/scheduling workflows.

Given a resource-constrained team of 1–2 full-stack engineers:
1. **Pragmatic Monolith First:** A structured monorepo containing `apps/web` (React) and `apps/api` (Express), joined in Phase 2 by `services/ml` (Python FastAPI).
2. **Schema & Migration Discipline:** SQLite backed by Knex.js provides zero-ops embedded database simplicity for MVP while maintaining strict SQL migrations allowing an effortless one-day pivot to PostgreSQL when write-concurrency demands it.
3. **Rigorous 80/20 Capacity Model:** Every 2-week sprint reserves **20% strictly for technical debt, testing, refactoring, and accessibility audits** to prevent the startup codebase from collapsing under feature velocity.

---

## Resource Allocation & Sprint Model

- **Sprint Duration:** 2 calendar weeks (10 working days).
- **Team Velocity (2 Developers):** 20 engineer-days total per sprint.
  - **Feature Work (80%):** 16 engineer-days (8 days / developer).
  - **Technical Debt & Quality Budget (20%):** 4 engineer-days (2 days / developer).
- **Roles:**
  - **Dev 1 (Lead Full-Stack / Platform):** Backend architecture, API routing, database schema/migrations, auth/RBAC, ML microservice harness, security.
  - **Dev 2 (Full-Stack / UX & A11y Lead):** Frontend architecture, React design system, elder accessibility (WCAG 2.1 AA), form validations, state management, client tests.

---

## 1. PHASE 1 — MVP (Weeks 1–10)

```
WEEKS 1-2          WEEKS 3-4          WEEKS 5-6          WEEKS 7-8          WEEKS 9-10
[Sprint 1-2]  -->  [Sprint 3-4]  -->  [Sprint 5-6]  -->  [Sprint 7-8]  -->  [Sprint 9-10]
Foundation & Auth  Directory & Shell  Appointments UI/API Prescriptions & Meds Family & Launch
```

---

### Sprint 1–2: Foundation & Core Infrastructure (Weeks 1–2)

**Sprint Goal:** Establish clean monorepo architecture, automated containerized development environment, core database schema, and stateless JWT-based authentication with role-based access control.

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S1-01** | Platform | Monorepo scaffolding (`apps/api`, `apps/web`, `packages/config`), Git hooks (Husky, lint-staged), ESLint, and Prettier configuration. | Dev 1 | 1.5d | Working monorepo with `pnpm` workspaces and pre-commit checks. |
| **S1-02** | DevOps | Multi-container `docker-compose.yml` for local development (Node.js API, Vite dev server, volume persistence). | Dev 1 | 1.0d | `docker compose up` spins up full stack with hot reload. |
| **S1-03** | Backend | Express.js server boilerplate, security middleware (Helmet, CORS, rate-limiting, request-id tracing), Winston/Morgan logging. | Dev 1 | 1.5d | Standardized Express server with structured JSON logging. |
| **S1-04** | Database | SQLite setup with Knex.js; write baseline migrations (`users`, `roles`, `refresh_tokens`, `audit_logs`). Enable WAL mode. | Dev 1 | 2.0d | Automated database migration and rollback scripts. |
| **S1-05** | Auth / Sec | User registration and authentication endpoints (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`) with bcrypt & JWT. | Dev 1 | 2.0d | Secure token lifecycle with HTTP-only cookies and token rotation. |
| **S1-06** | Auth / Sec | Role-Based Access Control (RBAC) middleware supporting roles: `PATIENT`, `DOCTOR`, `FAMILY_MEMBER`, `HOSPITAL_ADMIN`. | Dev 1 | 1.5d | Route guard middleware (`requireRole(['PATIENT', 'DOCTOR'])`). |
| **S1-07** | Quality | API testing harness setup (Jest + Supertest) with test database fixtures and migration runner. | Dev 2 | 2.5d | Automated test runner in CI/local checking auth endpoints. |
| **S1-08** | Tech Debt (20%) | Centralized API error handling class hierarchy, unified response envelope (`{ status, data, error, meta }`), and Swagger/OpenAPI baseline. | Dev 2 | 2.0d | Consistent error responses across all HTTP status codes. |
| **S1-09** | Quality (20%) | Write initial test suite for auth edge cases (expired tokens, duplicate email, SQL injection prevention). | Dev 1 | 2.0d | Auth test coverage > 90%. |
| **S1-10** | Docs | Architecture Decision Records (ADRs) for Monorepo, SQLite selection, and JWT strategy; developer setup guide in `README.md`. | Dev 2 | 1.0d | Complete onboarding documentation. |

---

### Sprint 3–4: Patient & Hospital Core (Weeks 3–4)

**Sprint Goal:** Deliver full CRUD for patient profiles, medical directories (hospitals, doctors, specializations), doctor scheduling availability, and the initial responsive React application with high-contrast, accessible onboarding.

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S2-01** | Database | Migrations for `patient_profiles` (DOB, blood type, emergency contacts, medical history summary) and `hospitals`, `doctors`, `departments`. | Dev 1 | 2.0d | Normalized tables with foreign key constraints and indices. |
| **S2-02** | Backend | Patient profile REST API (`GET/PUT /api/patients/me`, `GET /api/patients/:id` with permission check). | Dev 1 | 1.5d | Validated patient profile endpoints with Joi/Zod schemas. |
| **S2-03** | Backend | Doctor availability model and API (`doctor_schedules`, recurring shifts, break intervals, vacation blackouts). | Dev 1 | 2.5d | API to configure and query open availability slots by date range. |
| **S2-04** | Backend | Hospital and doctor search/filter API with full-text search, specialization, location, and rating filters. | Dev 1 | 2.0d | Search endpoint (`/api/directory/doctors?specialty=cardiology&hospitalId=1`). |
| **S2-05** | Database | Database seeders with realistic mock data for 5 hospitals, 25 doctors, 10 specialties, and 15 sample patient profiles. | Dev 1 | 1.0d | Reproducible database seed script (`npm run db:seed`). |
| **S2-06** | Frontend | React application setup via Vite, Tailwind CSS, React Router v6, Axios/React Query client, and elder-focused design tokens (typography, colors). | Dev 2 | 2.0d | Base web client with accessible theme (18px base text, high contrast). |
| **S2-07** | Frontend | Accessible Authentication views: Login, Register, Role selector, Password Reset request. Big touch targets, visible focus states. | Dev 2 | 2.5d | Fully functional auth UI connected to backend API. |
| **S2-08** | Frontend | Patient Dashboard Shell (navigation bar, emergency SOS quick-dial banner, greeting, quick-action cards, responsive drawer). | Dev 2 | 2.5d | High-contrast dashboard responsive on mobile, tablet, and desktop. |
| **S2-09** | Quality (20%) | Unit tests for search filter logic and React Testing Library tests for Login and Registration forms. | Dev 2 | 2.0d | Client test coverage > 80% for auth and navigation components. |
| **S2-10** | Tech Debt (20%) | Form validation abstractions using Zod and React Hook Form; centralized API client error interceptor with auto-redirect on 401. | Dev 1 | 2.0d | Reusable form components with accessible inline error announcements. |

---

### Sprint 5–6: Appointment Lifecycle & Management (Weeks 5–6)

**Sprint Goal:** Enable patients to discover doctors, book appointment slots, manage cancellations/rescheduling, receive in-app alerts, and provide doctors with a dedicated daily schedule agenda.

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S3-01** | Database | Knex migrations for `appointments` (status: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `RESCHEDULED`, reason, notes, type: `IN_PERSON`, `TELEHEALTH`). | Dev 1 | 1.5d | Indices on `(doctor_id, start_time)` and `(patient_id, start_time)`. |
| **S3-02** | Backend | Slot booking engine with double-booking prevention using transactional SQLite locks and slot validation logic. | Dev 1 | 2.5d | Atomically secure `POST /api/appointments` endpoint. |
| **S3-03** | Backend | Appointment lifecycle management API (`PATCH /api/appointments/:id/cancel`, `PATCH /api/appointments/:id/reschedule`, check 24-hr policy). | Dev 1 | 2.0d | Full cancellation/reschedule state machine with audit trails. |
| **S3-04** | Backend | In-app notification engine (trigger event records on appointment creation, reminder queued 24h & 2h before slot). | Dev 1 | 2.0d | `notifications` table and `GET /api/notifications` polling endpoint. |
| **S3-05** | Frontend | Doctor & Hospital directory UI: searchable directory cards, specialty badges, doctor bio modal, and direct "Book Visit" CTA. | Dev 2 | 2.5d | Clear directory UI with phone number fallbacks and location map links. |
| **S3-06** | Frontend | Step-by-step Elder-Friendly Booking Flow: large calendar picker, selectable time pills, plain-language confirmation summary. | Dev 2 | 2.5d | Simplified 3-step booking wizard with high-contrast text. |
| **S3-07** | Frontend | Patient Appointment Management View: upcoming vs. past visits, "Add to Google Calendar / iCal" export button, Reschedule/Cancel modal. | Dev 2 | 2.0d | User-friendly visit list with clear status indicators. |
| **S3-08** | Frontend | Doctor's Daily Agenda View: chronological patient queue, one-click patient medical summary preview, mark "Arrived" / "Completed". | Dev 2 | 2.0d | Dedicated doctor interface optimized for fast clinical scanning. |
| **S3-09** | Quality (20%) | Concurrency & race condition tests for appointment booking using Supertest parallel requests; UI unit tests for booking wizard. | Dev 1 | 2.0d | 100% test verification against double-booking bugs. |
| **S3-10** | Tech Debt (20%) | Extract reusable Date/Time formatting utilities with i18n support; remove hardcoded timezone bugs using UTC timestamp storage. | Dev 2 | 2.0d | Centralized date-time handling preventing timezone drift errors. |

---

### Sprint 7–8: Prescriptions & Medication Adherence (Weeks 7–8)

**Sprint Goal:** Implement digital prescription records, automated medication dose schedule generation, accessible daily pill-tracker interface, and adherence logging (taken, skipped, missed).

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S4-01** | Database | Migrations for `prescriptions`, `prescription_items` (dosage, frequency, instructions, start/end dates), and `medication_doses` log. | Dev 1 | 2.0d | Normalized medication relational schema with adherence tracking. |
| **S4-02** | Backend | Prescription upload & file storage API (multer middleware for PDF/PNG/JPEG validation, stored with UUIDs in local secure directory). | Dev 1 | 2.0d | Secure document upload and retrieval endpoints with auth guards. |
| **S4-03** | Backend | Schedule generation service: automatically generates daily dose instances in `medication_doses` based on frequency (e.g. BID = Morning/Night). | Dev 1 | 2.5d | Batch schedule generator populating daily intake slots. |
| **S4-04** | Backend | Medication dose action API: `POST /api/medications/doses/:id/record` (status: `TAKEN`, `SKIPPED`, `MISSED`, with timestamp and optional notes). | Dev 1 | 1.5d | Endpoints to record daily adherence and query adherence percentage. |
| **S4-05** | Frontend | "Today's Medicine Box" UI: visual pill tracker divided into Morning, Afternoon, Evening, and Bedtime sections with large color-coded buttons. | Dev 2 | 2.5d | Elder-accessible pill box UI with sound/haptic toggle and big checkboxes. |
| **S4-06** | Frontend | Dose Logging Interaction: instant visual feedback (green checkmark for Taken, amber pause for Skipped) and undo window. | Dev 2 | 1.5d | Satisfying, mistake-forgiving interaction reducing accidental touches. |
| **S4-07** | Frontend | Prescription Detail & Document Viewer: list of prescribed medicines, doctor's notes, refill warning banner, and scanned document lightbox. | Dev 2 | 2.0d | Comprehensive prescription viewer supporting multi-page scans. |
| **S4-08** | Frontend | Weekly Adherence Gauge: simple circular progress meter displaying "Weekly Health Score" (e.g., 92% of medicines taken on time). | Dev 2 | 2.0d | Positive-reinforcement adherence widget without punitive UX. |
| **S4-09** | Quality (20%) | Comprehensive test suite for schedule generation logic across complex recurring intervals (daily, alternate days, specific weekdays). | Dev 1 | 2.0d | Unit test coverage for recurring schedule calculation > 95%. |
| **S4-10** | Tech Debt (20%) | Sanitize file upload pipeline (file-type magic byte validation, size ceilings, filename sanitization preventing directory traversal). | Dev 2 | 2.0d | Hardened file upload middleware mitigating arbitrary file execution. |

---

### Sprint 9–10: Family Caregiver Dashboard, Polish & Launch (Weeks 9–10)

**Sprint Goal:** Implement caregiver delegation with explicit patient consent, the cross-cutting Family Dashboard, complete end-to-end integration tests, WCAG accessibility audit, and production-ready MVP deployment demo.

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S5-01** | Database | Migrations for `caregiver_links` (fields: `patient_id`, `caregiver_user_id`, `relationship`, `consent_status`: `PENDING`, `APPROVED`, `REVOKED`, `permissions`). | Dev 1 | 1.5d | Relational schema with security constraints enforcing consent. |
| **S5-02** | Backend | Caregiver linking workflow API: invite creation via email/code, patient consent approval endpoint, permission validation middleware. | Dev 1 | 2.0d | Complete proxy-access API preventing unauthorized data leakage. |
| **S5-03** | Backend | Aggregate Family Overview API (`GET /api/family/patients/:id/summary` aggregating next appointment, today's missed pills, vitals summary). | Dev 1 | 2.0d | Optimized single-query payload for high-performance dashboard load. |
| **S5-04** | Backend | In-app notification dispatcher: broadcasts alert to caregiver when an elder misses a critical medication dose by > 2 hours. | Dev 1 | 1.5d | Real-time / polling alert trigger for caregiver reassurance. |
| **S5-05** | Frontend | Patient Consent & Delegation Modal: simple switch interface where seniors can view, approve, or revoke access for their sons/daughters. | Dev 2 | 2.0d | Transparent, privacy-respecting consent management UI. |
| **S5-06** | Frontend | Family Dashboard View: multi-patient switcher (e.g. "Mom" & "Dad"), today's medication timeline, upcoming visits, and "Call Senior" speed-dial. | Dev 2 | 3.0d | Clean, comprehensive mobile-first portal for remote adult children. |
| **S5-07** | Frontend | Global In-App Notification Center: notification bell with unread badge count, dropdown tray, and deep-link routing. | Dev 2 | 1.5d | Standardized notification UI across all user personas. |
| **S5-08** | Quality | End-to-End Test Suite with Playwright: cover primary flows (signup -> doctor booking -> pill taken -> caregiver receives summary). | Dev 1 & 2 | 3.0d | Automated E2E test suite running green in under 3 minutes. |
| **S5-09** | Quality (20%) | Comprehensive Accessibility (a11y) Audit using axe-core and keyboard navigation verification across all views. | Dev 2 | 2.0d | WCAG 2.1 AA compliance certification report. |
| **S5-10** | Tech Debt (20%) | Database indexing audit on SQLite, foreign key validation check, and API documentation generation with Swagger UI. | Dev 1 | 1.5d | Interactive API docs at `/api-docs` and optimized queries (< 50ms). |

---

### MVP Deliverables Summary

At the completion of Week 10, the ElderGuardian AI platform delivers:

1. **Role-Based Web Application:** A unified React web application supporting four distinct personas:
   - **Elderly Patient:** Simplified interface, 18px+ typography, high-contrast buttons, pill checklist, one-tap appointment booking.
   - **Doctor:** Daily schedule overview, patient roster, appointment confirmation/rescheduling tools.
   - **Family Caregiver:** Remote oversight dashboard, medication adherence tracking, missed-dose alerts.
   - **Hospital Admin:** Doctor directory management, department organization, and facility schedule oversight.
2. **Appointment Scheduling Engine:** Transactional booking system preventing double-booking, with full lifecycle management (booking, cancellation, rescheduling, and in-app reminders).
3. **Prescription & Medication Tracker:** Secure prescription document vault, automated daily schedule generation from clinical directions, and single-tap dose logging (`TAKEN`, `SKIPPED`, `MISSED`).
4. **Caregiver Consent & Proxy Access:** Legal-grade patient consent workflow allowing elders to grant and revoke access to family members.
5. **Security & Data Layer:** SQLite in WAL mode with Knex.js migrations, bcrypt password hashing, JWT authentication with secure HTTP-only cookies, and role-based route protection.
6. **Production Readiness:** Docker Compose configuration, comprehensive OpenAPI/Swagger documentation, >80% unit test coverage, and automated E2E integration test suite.

---

## 2. PHASE 2 — Intelligence (Weeks 11–20)

**Strategic Focus:** Transition from passive record-keeping to proactive healthcare intelligence by introducing a Python microservice for optical character recognition (OCR), automated refill estimation, trend analytics, and partner integrations.

```
WEEKS 11-12          WEEKS 13-14          WEEKS 15-16          WEEKS 17-18          WEEKS 19-20
[Sprint 11-12]  -->  [Sprint 13-14]  -->  [Sprint 15-16]  -->  [Sprint 17-18]  -->  [Sprint 19-20]
Python OCR Engine    Refills & Analytics  Vitals & Trends      Pharmacy & Approval  Admin Dashboards & Stubs
```

---

### Sprint 11–12: Prescription OCR & Python ML Service (Weeks 11–12)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S6-01** | Architecture | Scaffold `services/ml` using Python 3.11 and FastAPI; configure Docker container and inter-service communication network. | Dev 1 | 2.0d | FastAPI service integrated into root `docker-compose.yml`. |
| **S6-02** | ML / OCR | Implement OCR pipeline using Tesseract OCR and OpenCV preprocessing (deskewing, adaptive binarization, noise removal). | Dev 1 | 3.0d | `POST /ocr/extract` accepting images/PDFs and returning raw text. |
| **S6-03** | ML / Parsing | Regex and heuristic entity extractor for medication name, dosage strength (e.g. 500mg), frequency (e.g. BID, Once Daily), and duration. | Dev 1 | 2.5d | Structured JSON parsing from unstructured clinical text. |
| **S6-04** | Backend | Express API client integration: upload prescription triggers async job to Python ML service with webhook/polling completion. | Dev 1 | 1.5d | Seamless prescription processing pipeline. |
| **S6-05** | Frontend | Interactive OCR Verification Screen: displays original scanned document side-by-side with parsed fields for patient/doctor confirmation. | Dev 2 | 3.5d | Human-in-the-loop review UI preventing OCR misinterpretation errors. |
| **S6-06** | Frontend | Manual correction interface allowing one-click editing of parsed drug names, frequency dropdowns, and dosage fields. | Dev 2 | 2.0d | Error-tolerant input mechanism ensuring 100% data fidelity. |
| **S6-07** | Quality (20%) | Benchmark test dataset of 50 sample prescriptions (printed and handwritten scans) measuring extraction accuracy. | Dev 1 | 2.5d | Automated accuracy regression test harness. |
| **S6-08** | Tech Debt (20%) | Async job queue abstraction (in-memory or Redis-ready worker queue) preventing slow OCR tasks from blocking Express event loop. | Dev 2 | 1.5d | Non-blocking background worker architecture. |

---

### Sprint 13–14: Deterministic Refill Estimation & Adherence Analytics (Weeks 13–14)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S7-01** | Backend | Deterministic Refill Estimation Engine: calculate pill exhaustion date based on total quantity dispensed, daily intake rate, and adherence logs. | Dev 1 | 2.5d | Refill prediction utility calculating exact run-out dates. |
| **S7-02** | Backend | Automated refill alert triggers: automatically flag medications reaching < 7 days of supply remaining. | Dev 1 | 1.5d | Scheduled cron job generating refill notification records. |
| **S7-03** | Backend | Adherence Analytics Aggregation API: calculate 7-day, 30-day, and 90-day compliance rates broken down by time of day. | Dev 1 | 2.5d | Analytics endpoints returning statistical compliance metrics. |
| **S7-04** | Frontend | Caregiver Adherence Dashboard: visual heatmaps, missed-dose patterns (e.g. "Frequently forgets Sunday evening dose"), and trends. | Dev 2 | 3.0d | Chart.js / Recharts visualization tailored for non-technical caregivers. |
| **S7-05** | Frontend | Prescription Refill Tracker: visual fuel-gauge showing remaining pills with clear color alerts (Green: >14d, Yellow: 7d, Red: <3d). | Dev 2 | 2.5d | Proactive visual warnings preventing sudden medication lapses. |
| **S7-06** | Quality (20%) | Unit tests for refill calculation edge cases (irregular frequencies, PRN / as-needed medications, skipped doses prolonging supply). | Dev 1 | 2.0d | Verified mathematical model for pill count depletion. |
| **S7-07** | Tech Debt (20%) | Optimize analytical aggregation queries with database indexing and materialized view caching for daily adherence. | Dev 2 | 2.0d | Sub-30ms execution for adherence calculation endpoints. |

---

### Sprint 15–16: Vitals Tracking & Clinical Trends (Weeks 15–16)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S8-01** | Database | Migrations for `health_readings` (fields: `patient_id`, `metric_type`: `BLOOD_PRESSURE_SYS`, `BLOOD_PRESSURE_DIA`, `HEART_RATE`, `BLOOD_GLUCOSE`, `WEIGHT`, `reading_value`, `unit`, `recorded_at`). | Dev 1 | 1.5d | Extensible time-series table structure. |
| **S8-02** | Backend | Vitals recording and time-range query API (`POST /api/vitals`, `GET /api/vitals?type=BLOOD_PRESSURE&range=30d`). | Dev 1 | 2.0d | Input validation schemas with clinical range limits (e.g. Reject Systolic > 300). |
| **S8-03** | Backend | Critical threshold alerting: automatic trigger generating alert if vitals breach safe ranges (e.g. Systolic > 180 or Blood Sugar < 70). | Dev 1 | 2.5d | Immediate high-priority notification to caregiver and doctor. |
| **S8-04** | Frontend | Large-Number Vitals Input Form: simplified numeric keypad, high-contrast labels, and clear unit selectors designed for elderly fingers. | Dev 2 | 3.0d | Accessible vitals entry form preventing numerical entry errors. |
| **S8-05** | Frontend | Health Readings Trend Charts: simple, uncluttered line charts displaying normal zones (green band) vs. out-of-range readings. | Dev 2 | 3.0d | Trend graphs with single-click time filters (7 Days, 1 Month, 3 Months). |
| **S8-06** | Quality (20%) | End-to-end integration test: vitals out-of-range triggers critical alert banner on Family Dashboard. | Dev 1 | 2.0d | Automated safety test verifying alert propagation. |
| **S8-07** | Tech Debt (20%) | Refactor common chart components into reusable UI library with responsive resizing and keyboard navigation. | Dev 2 | 2.0d | Accessible data visualization components. |

---

### Sprint 17–18: Pharmacy Adapter & Refill Approval Workflow (Weeks 17–18)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S9-01** | Backend | Pluggable Pharmacy Integration Architecture: define standard `PharmacyAdapter` interface (`submitOrder`, `checkStatus`, `getPricing`). | Dev 1 | 2.5d | Modular TypeScript interface for external pharmacy interchange. |
| **S9-02** | Backend | Mock Pharmacy Service: simulate external retail pharmacy partner (CVS/Walgreens mock) with webhook callbacks for status updates. | Dev 1 | 2.0d | End-to-end simulated pharmacy transaction engine. |
| **S9-03** | Backend | Refill Approval Workflow Engine: state machine handling `REQUESTED` -> `DOCTOR_REVIEW` -> `APPROVED` -> `PHARMACY_TRANSMITTED` -> `DISPATCHED`. | Dev 1 | 2.5d | Full audit-trailed clinical authorization lifecycle. |
| **S9-04** | Frontend | One-Click Refill Request UI: elder can request refill directly from the medicine box with a single button confirmation. | Dev 2 | 2.0d | Frictionless refill request flow requiring zero technical skill. |
| **S9-05** | Frontend | Doctor Refill Authorization Inbox: dedicated view for physicians to review pending refills, check adherence history, and sign off. | Dev 2 | 3.0d | Streamlined 2-click clinical sign-off interface for doctors. |
| **S9-06** | Quality (20%) | Contract testing for `PharmacyAdapter` mocking network timeouts, partial fills, and pharmacy rejection codes. | Dev 1 | 2.0d | Resilient handling of 3rd-party integration failures. |
| **S9-07** | Tech Debt (20%) | Implement database-backed state machine validator preventing invalid status transitions on refill requests. | Dev 2 | 2.0d | Zero illegal state transitions in medication ordering. |

---

### Sprint 19–20: Dashboards & Multi-Channel Notification Stubs (Weeks 19–20)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S10-01** | Backend | Notification Provider Abstraction: modular notification service supporting in-app, Email (SendGrid mock), and SMS (Twilio mock). | Dev 1 | 2.5d | Multi-channel dispatch engine with user notification preference routing. |
| **S10-02** | Backend | Hospital Admin Analytics API: clinic volume, doctor utilization rates, average appointment duration, and adherence by department. | Dev 1 | 2.5d | High-level facility metrics aggregation endpoints. |
| **S10-03** | Frontend | Hospital Admin Portal: manage doctor rosters, configure clinic hours, view facility-wide booking statistics and patient throughput. | Dev 2 | 3.0d | Administrative back-office dashboard for hospital staff. |
| **S10-04** | Frontend | Doctor Dashboard Enhancements: patient compliance breakdown, upcoming appointments with vital signs summary, refill review widget. | Dev 2 | 2.5d | Comprehensive single-pane-of-glass workspace for physicians. |
| **S10-05** | Frontend | User Notification Preferences UI: toggles for SMS, Email, and in-app alerts for appointments, medicine reminders, and family updates. | Dev 2 | 1.5d | Accessible settings page with sensible defaults (SMS enabled for reminders). |
| **S10-06** | Quality (20%) | End-to-end integration test verifying notification trigger to SMS/Email mock loggers on missed medication and refill approval. | Dev 1 | 2.0d | Fully verified multi-channel alert pipeline. |
| **S10-07** | Tech Debt (20%) | Conduct security review: enforce strict tenant isolation between hospitals; audit API rate limiting across public endpoints. | Dev 2 | 2.0d | Penetration test sign-off and rate-limiting hardening. |

---

## 3. PHASE 3 — Advanced (Weeks 21–30+)

**Strategic Focus:** Elevate ElderGuardian AI into an autonomous, proactive safety net. Introduce ambient voice assistance, wearable health ingestion, automated fall risk indicators, multi-hospital tenancy, and enterprise-grade security hardening.

```
WEEKS 21-22          WEEKS 23-24          WEEKS 25-26          WEEKS 27-28          WEEKS 29-30+
[Sprint 21-22]  -->  [Sprint 23-24]  -->  [Sprint 25-26]  -->  [Sprint 27-28]  -->  [Sprint 29-30+]
Wearables & Labs     Voice Assistant & Fall Risk & Alerts     Multi-Hospital Tenant Performance & Hardening
```

---

### Sprint 21–22: Wearable Ingestion & Lab Diagnostic Integration (Weeks 21–22)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S11-01** | Architecture | Wearable Health Ingestion Framework: standardized webhook and time-series intake API (Apple HealthKit / Google Health Connect mock). | Dev 1 | 2.5d | Ingestion endpoint handling batch telemetry data (heart rate, step count, sleep). |
| **S11-02** | Backend | Lab Integration Adapter (mock FHIR / HL7 format): ingest diagnostic lab reports (lipid panels, HbA1c, metabolic panels). | Dev 1 | 2.5d | Standardized diagnostic test schema and storage engine. |
| **S11-03** | Frontend | Wearable Sync Status & Daily Activity Widget: step counts, resting heart rate, and sleep duration presented in clear, simple numbers. | Dev 2 | 2.5d | Encouraging daily movement and activity monitor. |
| **S11-04** | Frontend | Lab Results Viewer: non-jargon translation of laboratory results with visual indicators showing "Normal", "Needs Discussion", or "Flagged". | Dev 2 | 2.5d | Plain-language lab report reader reducing patient anxiety. |
| **S11-05** | Quality (20%) | Stress testing time-series data ingestion with 10,000 synthetic wearable datapoints per minute. | Dev 1 | 2.0d | Verified ingestion pipeline stability under load. |
| **S11-06** | Tech Debt (20%) | Time-series data compaction strategy: auto-roll older high-frequency telemetry into daily summary averages to preserve SQLite performance. | Dev 2 | 2.0d | Automated database pruning and archival routine. |

---

### Sprint 23–24: Ambient Voice Assistant & Fall Detection Prototype (Weeks 23–24)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S12-01** | Frontend | Web Speech API integration: speech-to-text listener and text-to-speech synthesizer customized for senior vocal cadences. | Dev 2 | 3.0d | Hands-free voice interface for elder patient dashboard. |
| **S12-02** | Frontend | Voice Command Parser: recognize key intents ("I took my morning pills", "When is my next doctor visit?", "Call my daughter"). | Dev 2 | 2.5d | Natural voice-activated navigation without typing. |
| **S12-03** | Backend | Accelerometer Fall Detection Prototype: Web DeviceMotion API ingestion module streaming sudden deceleration + impact signatures. | Dev 1 | 3.0d | Client-side motion threshold detector with emergency webhook trigger. |
| **S12-04** | Frontend | Fall Alert Countdown Modal: 30-second audible siren with giant "I'M OKAY — CANCEL" button before dispatching SOS alert to caregivers. | Dev 2 | 2.0d | False-alarm mitigation screen with loud audible countdown. |
| **S12-05** | Quality (20%) | Voice recognition cross-browser testing (Chrome, Safari, Edge) across different regional accents and speech tempos. | Dev 1 | 2.0d | Speech accuracy validation report. |
| **S12-06** | Tech Debt (20%) | Fallback UX for devices lacking Web Speech or Accelerometer sensors (graceful feature degradation without crashes). | Dev 2 | 2.0d | Bulletproof browser compatibility fallbacks. |

---

### Sprint 25–26: Proactive Risk Monitoring & Safety Intelligence (Weeks 25–26)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S13-01** | Backend | Rule-Based Patient Risk Scoring Engine: combine missed medication percentage, abnormal vitals frequency, and inactivity into 0–100 Risk Score. | Dev 1 | 3.0d | Automated nightly patient stratification algorithm. |
| **S13-02** | Backend | Escalation Matrix Dispatcher: multi-tiered alerts (Tier 1: In-app nudge; Tier 2: Caregiver SMS; Tier 3: Clinic triage alert). | Dev 1 | 2.5d | Automated clinical escalation workflow. |
| **S13-03** | Frontend | Proactive Risk Monitoring Dashboard: clinical view sorting all assigned patients by current risk category (Green, Amber, Red). | Dev 2 | 3.0d | Population health triage dashboard for clinicians and nursing staff. |
| **S13-04** | Frontend | Elder "Safety Check-In" Card: friendly morning prompt ("Good morning Margaret! How are you feeling today?") with 3 large emoji buttons. | Dev 2 | 2.0d | Non-invasive subjective well-being tracking. |
| **S13-05** | Quality (20%) | Simulation test running 1,000 synthetic patient risk score permutations to verify that false-positive escalation rates stay below 5%. | Dev 1 | 2.0d | Validated risk scoring thresholds. |
| **S13-06** | Tech Debt (20%) | Refactor notification and alert dispatchers to utilize idempotency keys, eliminating duplicate emergency SMS sends. | Dev 2 | 2.0d | Zero duplicate alerts on retry. |

---

### Sprint 27–28: Multi-Hospital Tenancy & Healthcare Network (Weeks 27–28)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S14-01** | Architecture | Multi-Tenancy Architecture: partition hospital data using `tenant_id` column-level isolation and scoped Express database middleware. | Dev 1 | 3.5d | Robust tenant context isolation across all queries. |
| **S14-02** | Backend | Inter-Hospital Referral API: allow doctors at Hospital A to securely transfer patient records to a specialist at Hospital B with patient consent. | Dev 1 | 2.5d | Secure cross-tenant clinical referral workflow. |
| **S14-03** | Frontend | Super-Admin Multi-Hospital Management Portal: onboard new hospital facilities, assign administrators, and configure tenant settings. | Dev 2 | 3.0d | Enterprise SaaS administrative console. |
| **S14-04** | Frontend | Custom Clinic Branding Theme Provider: support dynamic hospital logo and color scheme overrides based on user's affiliated facility. | Dev 2 | 2.0d | White-label UI theme engine. |
| **S14-05** | Quality (20%) | Tenant data leak penetration tests: verify that SQL queries under Tenant X cannot access or infer records belonging to Tenant Y. | Dev 1 | 2.0d | Multi-tenancy isolation audit passed (0 leaks). |
| **S14-06** | Tech Debt (20%) | Audit all database foreign keys, cascade deletes, and Knex query builders for strict `where('tenant_id', tenantId)` enforcement. | Dev 2 | 2.0d | Comprehensive query isolation refactoring. |

---

### Sprint 29–30+: Performance Optimization, Security Hardening & HIPAA Readiness (Weeks 29–30+)

| Task ID | Work Stream | Description | Owner | Estimate | Deliverable / Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S15-01** | Database | SQLite to PostgreSQL Migration Bridge: benchmark schema, configure connection pooling (pgbouncer), and execute test migration script. | Dev 1 | 3.0d | Production-ready PostgreSQL migration path. |
| **S15-02** | Security | HIPAA & GDPR Security Hardening: field-level encryption for Sensitive Personal Health Information (PHI) at rest (AES-256). | Dev 1 | 3.0d | PHI encryption layer in Knex model hooks. |
| **S15-03** | Security | Comprehensive Audit Logging: immutable logging for all reads/writes of patient medical records with IP and user identity tracking. | Dev 1 | 2.0d | HIPAA-compliant access audit log. |
| **S15-04** | Performance | Frontend Bundle Optimization: route-based code splitting, lazy loading of charts and OCR viewer, WebP image asset compression. | Dev 2 | 2.5d | Lighthouse performance score > 90; initial bundle size < 250KB. |
| **S15-05** | Performance | Backend Caching Layer: introduce Redis caching for doctor directories, clinic schedules, and read-heavy static configurations. | Dev 2 | 2.0d | API p95 response time < 50ms across all read routes. |
| **S15-06** | Quality (20%) | Automated OWASP Top 10 security scan (ZAP, Snyk dependency check) and secret leak detection in CI/CD pipeline. | Dev 1 | 2.0d | Zero critical/high CVEs in dependency graph. |
| **S15-07** | Tech Debt (20%) | Complete documentation refresh: update system architecture diagrams, API Swagger definitions, and disaster recovery runbooks. | Dev 2 | 2.0d | Fully up-to-date engineering documentation. |

---

## 4. MILESTONE DEFINITIONS

```
   [M1: Wk 2]          [M2: Wk 4]          [M3: Wk 6]          [M4: Wk 8]          [M5: Wk 10]
 Foundation & Auth   Directory & Profile  Appointment Life    Medication Adhere   MVP Production
                                                                                       |
   [M6: Wk 20] <-----------------------------------------------------------------------+
 Intelligence Engine
        |
   [M7: Wk 30]
 Enterprise Proactive Care
```

---

### Milestone 1: Foundation & Identity (End of Week 2)
- **Deliverables:**
  - Standardized monorepo repository with working CI lint and test checks.
  - Multi-container Docker Compose local development environment.
  - Express.js API with Knex.js migrations running on SQLite in WAL mode.
  - JWT authentication with secure HTTP-only cookies and token rotation.
  - Role-based access control (RBAC) middleware supporting 4 core personas.
- **Demo Scenario:**
  1. Engineer clones repo, runs `docker compose up`, and accesses the running API within 2 minutes.
  2. Register 4 distinct users (Patient, Doctor, Family Member, Admin) via REST endpoints.
  3. Attempt to access a protected doctor-only route using a patient token; verify `403 Forbidden` response.
  4. Perform token refresh using the refresh token; verify seamless JWT issuance.
- **Success Criteria:**
  - Automated test suite passes with >90% code coverage on auth module.
  - Sub-10ms response times on health check and token verification.
  - Zero unhandled exceptions or memory leaks on server restart.
- **Dependencies:**
  - Node.js LTS, Docker Engine installed on local machines.
- **Risk Factors & Mitigations:**
  - *Risk:* Token hijacking or leakage.
  - *Mitigation:* Store tokens exclusively in secure, SameSite=Strict, HTTP-only cookies; reject plain Authorization header tokens for web clients.

---

### Milestone 2: Directory & Patient Onboarding (End of Week 4)
- **Deliverables:**
  - React (Vite) client configured with Tailwind CSS and elder-accessible design tokens.
  - Accessible Login, Register, and Onboarding screens.
  - Patient Profile CRUD API and interactive profile manager.
  - Doctor and hospital directory with realistic seed data and search/filter API.
  - Responsive patient dashboard shell featuring SOS quick-dial banner.
- **Demo Scenario:**
  1. User navigates to web portal, registers as an 72-year-old patient with high-contrast UI mode enabled.
  2. Patient completes medical profile (blood group, allergies, emergency contact phone).
  3. Patient searches for "Cardiologist" within "St. Jude Hospital", viewing doctor credentials and available schedules.
- **Success Criteria:**
  - WCAG 2.1 AA automated compliance check passes with 0 violations on all forms.
  - Directory search returns results in < 50ms across 100+ seeded records.
  - Input forms successfully usable via keyboard-only navigation.
- **Dependencies:**
  - Completion of M1 authentication and database migrations.
- **Risk Factors & Mitigations:**
  - *Risk:* Elderly users frustrated by complex form inputs.
  - *Mitigation:* Limit form screens to maximum 3 inputs per step; use 18px+ font sizes, prominent helper text, and real-time inline validation.

---

### Milestone 3: Appointment Lifecycle (End of Week 6)
- **Deliverables:**
  - Transaction-safe appointment booking engine with double-booking prevention.
  - Patient self-service booking flow with calendar and time-slot selector.
  - Appointment management interface (cancellation, rescheduling with 24-hr validation).
  - Doctor daily agenda view with patient check-in workflow.
  - In-app notification triggers for upcoming visit reminders.
- **Demo Scenario:**
  1. Patient selects Dr. Smith, browses available slots for upcoming Tuesday, and confirms a 10:00 AM visit.
  2. Attempt to book the exact same slot simultaneously from another browser; second booking is gracefully rejected with "Slot already reserved".
  3. Doctor logs into provider portal, views Dr. Smith's daily schedule, sees the new patient booking, and clicks "Confirm".
  4. Patient receives in-app confirmation notification and tests rescheduling the visit to 2:00 PM.
- **Success Criteria:**
  - 100% prevention of concurrent race-condition double bookings under automated Supertest stress load.
  - Complete booking flow completed in under 4 taps from dashboard.
- **Dependencies:**
  - Doctor schedule availability records from M2.
- **Risk Factors & Mitigations:**
  - *Risk:* Race conditions on slot selection during peak hours.
  - *Mitigation:* SQLite transactional lock (`knex.transaction`) wrapping slot verification and status reservation.

---

### Milestone 4: Medication Adherence & Regimen (End of Week 8)
- **Deliverables:**
  - Prescription document upload and storage system with MIME-type security.
  - Medication regimen generator converting dosage instructions into daily intake schedules.
  - "Today's Medicine Box" interface organized by time of day (Morning/Afternoon/Evening/Bedtime).
  - One-tap dose action logging (`TAKEN`, `SKIPPED`, `MISSED`) with undo grace period.
  - Patient weekly adherence progress indicator.
- **Demo Scenario:**
  1. Upload scanned prescription for Metformin (500mg BID) and Lisinopril (10mg Daily Morning).
  2. Patient opens dashboard to see pills automatically slotted into Morning and Evening buckets.
  3. Patient taps "Take" on Morning Lisinopril; button turns bright green with confirmation chime.
  4. Patient tests undoing an accidental tap within 10 seconds.
  5. Adherence percentage dynamically updates to reflect recorded doses.
- **Success Criteria:**
  - Daily schedule calculation handles all standard clinical frequencies (QD, BID, TID, QID, PRN).
  - Dose recording response latency under 30ms for seamless offline/slow-connection experience.
- **Dependencies:**
  - M2 Patient Profile and M1 Secure File Storage.
- **Risk Factors & Mitigations:**
  - *Risk:* Accidental double-taps by tremors or shaky hands causing false logs.
  - *Mitigation:* Minimum touch target of 56x56px, 10-second undo toast, and confirmation debounce timers.

---

### Milestone 5: MVP Launch — Family Care Ecosystem (End of Week 10)
- **Deliverables:**
  - Caregiver linking engine with explicit, patient-controlled digital consent.
  - Dedicated Family Dashboard with multi-patient monitoring view.
  - Caregiver notification alerts for missed medications (>2 hours overdue).
  - End-to-end automated Playwright regression test suite.
  - Production-ready Docker container and complete OpenAPI Swagger documentation.
- **Demo Scenario:**
  1. Elder patient Margaret generates an invite code for her adult son David.
  2. David logs in as Family Caregiver, inputs code; Margaret receives an approval prompt on her dashboard and clicks "Authorize Son".
  3. David opens Family Dashboard, sees Margaret's active medication list, adherence score of 95%, and next cardiology appointment.
  4. Simulate Margaret missing an evening blood pressure pill; David's dashboard receives an alert badge highlighting the missed dose.
- **Success Criteria:**
  - Zero critical or high-severity vulnerabilities in security audit.
  - Automated Playwright E2E suite passes 100% on clean checkout.
  - Patient consent revocation immediately severs all caregiver access to records.
- **Dependencies:**
  - Sprints 1 through 8 completed.
- **Risk Factors & Mitigations:**
  - *Risk:* Caregiver accessing sensitive patient records without elder consent.
  - *Mitigation:* Strict database-level foreign key and permission checks requiring `consent_status = 'APPROVED'` on every query.

---

### Milestone 6: Intelligence & Automated Care (End of Week 20)
- **Deliverables:**
  - Python FastAPI ML microservice running containerized OCR and clinical entity extraction.
  - Human-in-the-loop OCR verification screen.
  - Deterministic refill prediction engine and low-supply automated alerting.
  - Chronic disease vitals tracker with clinical out-of-bounds alerting.
  - Pluggable mock pharmacy integration with doctor refill authorization queue.
  - Multi-channel notification dispatchers (Email and SMS stubs).
- **Demo Scenario:**
  1. Upload photo of printed prescription; Python OCR service parses drug name, dosage, and frequency in 2.5 seconds.
  2. User verifies parsed data in side-by-side view and approves creation of medication schedule.
  3. Refill engine computes remaining pills; as supply drops below 7 days, elder sees a 1-tap "Request Refill" button.
  4. Doctor receives notification in authorization inbox, reviews patient's 90-day 94% adherence record, and clicks "Approve Refill".
  5. Mock pharmacy webhook updates order status to "Dispatched".
- **Success Criteria:**
  - OCR extraction accuracy > 85% on standard printed clinical prescriptions.
  - Refill prediction model maintains 100% mathematical precision on scheduled dosage rates.
  - Zero blocking of Express main event loop during OCR processing.
- **Dependencies:**
  - Completion of M5 MVP baseline; Dockerized Python environment.
- **Risk Factors & Mitigations:**
  - *Risk:* Machine learning hallucinations or OCR errors causing fatal medication dosing errors.
  - *Mitigation:* Zero unconfirmed automated insertions; mandatory human-in-the-loop verification step required before any OCR-extracted prescription is activated.

---

### Milestone 7: Enterprise Proactive Care & Safety (End of Week 30)
- **Deliverables:**
  - Hands-free Web Speech voice assistant for elderly navigation.
  - Device motion accelerometer fall detection prototype with audible emergency cancellation.
  - Time-series wearable telemetry and plain-English lab diagnostic viewer.
  - Population health risk stratification dashboard for clinics.
  - Multi-tenant hospital isolation architecture with custom branding.
  - HIPAA-ready audit logging, PHI field-level encryption, and PostgreSQL migration bridge.
- **Demo Scenario:**
  1. Elder says "Hello Guardian, did I take my heart medicine today?"; assistant replies audibly "Yes Margaret, you took Lisinopril at 8:15 AM".
  2. Simulate phone drop impact; application sounds loud 30-second siren with countdown; user taps "I'm okay", canceling alert dispatch.
  3. Hospital staff opens multi-tenant portal under "Metro Health", viewing only their assigned patients stratified into High, Medium, and Low risk cohorts.
- **Success Criteria:**
  - Multi-tenant boundary penetration tests show 0 cross-tenant data leakage.
  - Database queries maintain p95 < 50ms under simulated 100,000 record volume.
  - Field-level encryption completely obscures patient names, diagnoses, and notes in raw database dumps.
- **Dependencies:**
  - Phase 2 intelligence services and production infrastructure.
- **Risk Factors & Mitigations:**
  - *Risk:* Performance degradation as SQLite database grows with wearable time-series telemetry.
  - *Mitigation:* Execute pre-tested Knex migration bridge to PostgreSQL with dedicated time-series table partitioning.

---

## 5. TECHNICAL DEBT BUDGET & ENGINEERING STANDARDS

### The 20% Technical Debt Allocation Policy

In high-velocity startup environments, technical debt is often ignored until development grinds to a halt. In ElderGuardian AI, where patient health and safety are involved, codebase instability is an unacceptable clinical risk.

**Policy:** Exactly **20% of engineering capacity (2 full developer-days per 10-day sprint per engineer)** is dedicated exclusively to refactoring, testing, and system hygiene. Feature commitments must fit within the remaining 80%.

```
+-----------------------------------------------------------+
|               2-WEEK SPRINT CAPACITY (20 DAYS)            |
+---------------------------------------------+-------------+
|          80% Product Features (16 Days)     | 20% Tech Debt|
|      Core Capabilities & User Stories       |  & Quality  |
|                                             |   (4 Days)  |
+---------------------------------------------+-------------+
```

### Specific Technical Debt Focus Areas

```
+---------------------------------------------------------------------------------------+
|                              TECHNICAL DEBT WATCHLIST                                 |
+-----------------------------------+---------------------------------------------------+
| Area                              | Enforcement & Monitoring Metric                   |
+-----------------------------------+---------------------------------------------------+
| 1. Test Coverage Enforced in CI   | Unit coverage >= 80% for new code; zero untested  |
|                                   | business logic in controllers/services.           |
+-----------------------------------+---------------------------------------------------+
| 2. API Contract & Documentation   | OpenAPI (Swagger) spec updated in the same PR     |
|                                   | as endpoint changes; no undocumented routes.      |
+-----------------------------------+---------------------------------------------------+
| 3. Resilient Error Handling       | Standardized response envelope; zero unhandled    |
|                                   | Promise rejections; client error boundaries.      |
+-----------------------------------+---------------------------------------------------+
| 4. Database Schema Hygiene        | Portable Knex migrations (no SQLite-specific      |
|                                   | hacks); foreign key indices on all joins.         |
+-----------------------------------+---------------------------------------------------+
| 5. Elder Accessibility (A11y)     | Automated axe-core score = 100; full keyboard     |
|                                   | traversal verification on every release.          |
+-----------------------------------+---------------------------------------------------+
| 6. Mock Service Decoupling        | All external services (Pharmacy, SMS, Wearables)  |
|                                   | isolated behind clean TypeScript interfaces.      |
+-----------------------------------+---------------------------------------------------+
+---------------------------------------------------------------------------------------+
```

#### Detailed Focus Item Guidelines:

1. **Test Coverage & Regression Prevention:**
   - Pre-commit and CI gates automatically fail any pull request dropping overall test coverage below 80%.
   - Every bug report must be accompanied by a reproducing test before the fix is merged.
2. **Documentation & Architecture Decision Records (ADRs):**
   - Major technical decisions (e.g., SQLite WAL mode, Tesseract over cloud OCR, JWT storage in cookies) must be documented in `/docs/adr/`.
   - Swagger / OpenAPI documentation is maintained synchronously with code using JSDoc route annotations.
3. **Resilient Error Handling & Logging:**
   - No generic `catch (e) { console.log(e); }`. All errors must be routed through custom operational error classes (`ValidationError`, `NotFoundError`, `UnauthorizedError`, `ConflictError`).
   - Winston logger records correlation IDs across HTTP requests for end-to-end traceability.
4. **Database Indexing & SQLite-to-PostgreSQL Portability:**
   - Schema migrations must avoid SQLite-specific idiosyncrasies. Use standard SQL column types supported symmetrically by PostgreSQL (`integer`, `string`, `text`, `boolean`, `timestamp`).
   - Foreign key indices are created explicitly on every reference column to prevent full-table scans during relational joins.
5. **Decoupled Mock Adapters:**
   - External services (CVS/Walgreens pharmacy, Twilio SMS, SendGrid Email, HealthKit wearables) must implement strict TypeScript interfaces (`INotificationService`, `IPharmacyAdapter`).
   - Switching from local mock adapters to live vendor APIs in production requires only changing an environment variable (`PHARMACY_ADAPTER=live_cvs`).

---

## 6. DEFINITION OF DONE (DoD)

A user story or task is considered **"Done"** and ready to merge into the `main` branch only when it satisfies all criteria on this checklist:

```
[ ] 1. Code Review Completed
    - At least one peer review approval.
    - Architectural alignment and coding conventions respected (ESLint / Prettier pass clean).
    - No commented-out debug code, console.log statements, or temporary test hacks.

[ ] 2. Unit Testing Standards Met
    - All unit tests pass locally and in CI environment.
    - Code coverage >= 80% on all newly created business logic, services, and utilities.
    - Boundary conditions, null inputs, and error states explicitly tested.

[ ] 3. Integration Tests for Critical Paths
    - Supertest API integration tests cover primary success and failure HTTP responses.
    - Database transactions, rollbacks, and constraint violations verified.
    - E2E Playwright tests passing for critical user journeys (Auth, Booking, Pill Check).

[ ] 4. API Documentation Synchronized
    - Swagger/OpenAPI documentation annotations updated.
    - Request payloads, query parameters, and response schemas match implementation exactly.
    - Example requests and responses provided for all status codes (200, 400, 401, 403, 404, 500).

[ ] 5. Zero Critical or High-Severity Bugs
    - Static analysis scan (Snyk / npm audit / CodeQL) reports zero Critical or High vulnerabilities.
    - No known P0 (blocker) or P1 (major functionality impaired) defects remain open.

[ ] 6. Accessibility & Elder-Friendly UX Standards (WCAG 2.1 AA)
    - Automated accessibility scan (axe-core / Lighthouse) reports 0 violations.
    - Typography adheres to minimum font size standards (>= 16px body, 18px recommended for elder UI).
    - Contrast ratio satisfies minimum 4.5:1 for standard text and 3:1 for large interactive elements.
    - Interactive touch targets measure at least 48x48 CSS pixels (recommended 56x56px for pill buttons).
    - Full keyboard navigation supported with visible focus rings (`focus-visible`).
    - Screen-reader friendly semantic HTML (`<main>`, `<nav>`, `<button>`, `aria-live` for alerts).

[ ] 7. Data Privacy & Security Governance
    - Endpoint guarded by explicit authentication and RBAC authorization middleware.
    - Input data sanitized and strictly validated against Zod schemas.
    - No Protected Health Information (PHI) or credentials logged to stdout or files.
    - Audit log entry created for sensitive patient record access or modification.
```

---

## 7. RISK MANAGEMENT & MITIGATION MATRIX

| Risk Description | Severity | Probability | Impact Area | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Elderly UX Rejection:** Seniors find the mobile/web interface confusing, leading to abandoned usage. | **High** | Medium | Product Adoption | Implement 18px+ typography, simplified 1-action screens, high-contrast themes, physical undo safety windows, and voice assistant fallback. Validate weekly with real senior test users. |
| **Medication Schedule Errors:** Incorrect schedule generation leads to missed or duplicated doses. | **Critical** | Low | Patient Safety | 100% test coverage on schedule generation algorithms. Require human-in-the-loop review for all OCR-scanned prescriptions. Implement double-tap protection on dose recording. |
| **Concurrent Booking Clashes:** Simultaneous doctor slot bookings create double-booking conflicts. | **High** | Medium | Doctor Trust | Wrap appointment validation and insertion inside serializable SQLite database transactions (`knex.transaction`) with immediate atomic slot status locking. |
| **SQLite Concurrency Bottlenecks:** Increased write activity locks the database during peak hours. | **Medium** | Medium | System Performance | Enable SQLite WAL (Write-Ahead Logging) mode immediately. Keep transactions micro-short (< 5ms). Maintain Knex migrations strictly portable to enable rapid switch to PostgreSQL. |
| **Caregiver Privacy Violation:** Unauthorized access to patient health data without explicit authorization. | **Critical** | Low | Legal / Compliance | Enforce patient consent records with cryptographic hash audits. Every family query joins on active `APPROVED` consent records. Patients can revoke access with 1 tap. |
| **Developer Burnout (1-2 Devs):** Startup velocity pressure leads to sloppy code, skipped tests, and fatigue. | **High** | High | Team Velocity | Enforce the 20% Technical Debt allocation in every sprint. Maintain a strict Definition of Done. Scope down non-essential features before compromising testing or quality. |

---

## Conclusion & Next Steps

This engineering roadmap provides a deterministic, phased trajectory from initial repository scaffolding to a secure, accessible, AI-augmented healthcare platform. By strictly honoring the 80/20 capacity balance and enforcing accessibility and testing in the Definition of Done, the 1–2 person engineering team will deliver a robust, elder-friendly MVP by Week 10 and smoothly scale into predictive intelligence by Week 20.
