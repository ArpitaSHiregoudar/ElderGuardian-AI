# ElderGuardian AI — Comprehensive System Architecture Document
**Healthcare Coordination Platform for Geriatric Care**
**Document Version:** 1.0.0-PROD  
**Architect:** Senior Healthcare System Architect  
**Status:** Approved for Implementation  
**Target Environments:** Local Development (Docker Compose), Staging/Production (Cloud VPS / Managed Cloud)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Section 1: High-Level Architecture](#1-high-level-architecture)
   - [1.1 Problem Context & Strategic Vision](#11-problem-context--strategic-vision)
   - [1.2 Architectural Philosophy: Modular Monolith vs. Microservices](#12-architectural-philosophy-modular-monolith-vs-microservices)
   - [1.3 High-Level System Architecture Diagram](#13-high-level-system-architecture-diagram)
   - [1.4 System Topology & Core Subsystems](#14-system-topology--core-subsystems)
3. [Section 2: Backend Module Architecture](#2-backend-module-architecture)
   - [2.1 Modular Monolith Architectural Pattern](#21-modular-monolith-architectural-pattern)
   - [2.2 In-Process Event Bus Architecture](#22-in-process-event-bus-architecture)
   - [2.3 Detailed Module Specifications (11 Core Modules)](#23-detailed-module-specifications)
4. [Section 3: ML Microservice Architecture](#3-ml-microservice-architecture)
   - [3.1 Microservice Overview & Tech Stack](#31-microservice-overview--tech-stack)
   - [3.2 Prescription OCR Pipeline](#32-prescription-ocr-pipeline)
   - [3.3 Medicine Name & Dosage NLP Extraction](#33-medicine-name--dosage-nlp-extraction)
   - [3.4 Adherence Prediction Engine](#34-adherence-prediction-engine)
   - [3.5 Medication Depletion Engine](#35-medication-depletion-engine)
   - [3.6 Geriatric Risk Scoring (Future Roadmap)](#36-geriatric-risk-scoring-future-roadmap)
   - [3.7 Inter-Service Communication & API Contracts](#37-inter-service-communication--api-contracts)
5. [Section 4: Data Flow Sequence Diagrams](#4-data-flow-sequence-diagrams)
   - [4.1 Patient Registration & Guardian Onboarding](#41-patient-registration--guardian-onboarding)
   - [4.2 Appointment Booking Flow](#42-appointment-booking-flow)
   - [4.3 Prescription Upload → Medication Schedule Creation](#43-prescription-upload--medication-schedule-creation)
   - [4.4 Refill Coordination Flow (Detection → Approval → Fulfillment)](#44-refill-coordination-flow-detection--approval--fulfillment)
   - [4.5 Family Member / Caregiver Delegated Access Flow](#45-family-member--caregiver-delegated-access-flow)
6. [Section 5: Security Architecture & Healthcare Compliance](#5-security-architecture--healthcare-compliance)
   - [5.1 Healthcare Compliance Foundations (HIPAA & ePHI)](#51-healthcare-compliance-foundations-hipaa--ephi)
   - [5.2 Authentication & Token Lifecycle](#52-authentication--token-lifecycle)
   - [5.3 Express API Gateway & Middleware Stack](#53-express-api-gateway--middleware-stack)
   - [5.4 Data Encryption Strategy (In-Transit, At-Rest, Field-Level)](#54-data-encryption-strategy-in-transit-at-rest-field-level)
   - [5.5 Rate Limiting & DoS Mitigation](#55-rate-limiting--dos-mitigation)
   - [5.6 CORS & Browser Security Policy](#56-cors--browser-security-policy)
7. [Section 6: Deployment & Operational Architecture](#6-deployment--operational-architecture)
   - [6.1 Local Development Environment (Docker Compose)](#61-local-development-environment-docker-compose)
   - [6.2 Production Deployment Progression](#62-production-deployment-progression)
   - [6.3 Configuration & Secrets Management](#63-configuration--secrets-management)
8. [Section 7: Integration Architecture](#7-integration-architecture)
   - [7.1 Adapter Pattern for External Services](#71-adapter-pattern-for-external-services)
   - [7.2 Mock Adapter Suite for MVP](#72-mock-adapter-suite-for-mvp)
   - [7.3 FHIR R4 Interoperability Compatibility Layer](#73-fhir-r4-interoperability-compatibility-layer)
   - [7.4 Webhook Ingestion Engine](#74-webhook-ingestion-engine)

---

## Executive Summary

**ElderGuardian AI** is an enterprise-grade digital healthcare coordination platform engineered specifically for geriatric patients, family caregivers, attending physicians, and partner pharmacies. The platform mitigates critical challenges in eldercare: polypharmacy errors, missed medication doses, uncoordinated refill gaps, and fragmented medical communication.

The platform employs a hybrid architecture: a **Modular Monolith** built on **Node.js/Express and TypeScript** for all transactional and administrative healthcare workflows, coupled with a dedicated, decoupled **Python/FastAPI Machine Learning Microservice** for compute-intensive optical character recognition (OCR), clinical Natural Language Processing (NLP), and predictive adherence/depletion intelligence.

---

# 1. HIGH-LEVEL ARCHITECTURE

### 1.1 Problem Context & Strategic Vision
Geriatric healthcare delivery is plagued by cognitive decline, high medication regimen complexity (often 5 to 15 concurrent daily prescriptions), distributed care circles (children, professional aides, visiting nurses), and disjointed communication channels between clinic, patient home, and retail pharmacy.

ElderGuardian AI centralizes this ecosystem by:
1. Converting physical prescriptions into verified digital dosage schedules via machine learning.
2. Automating medication reminders and logging adherence events with family notification triggers.
3. Continuously calculating depletion horizons and orchestrating physician-supervised pharmacy refills before medications run out.
4. Providing real-time clinical health dashboards for doctors and intuitive, high-contrast, accessible interfaces for seniors and family caregivers.

---

### 1.2 Architectural Philosophy: Modular Monolith vs. Microservices

A pivotal decision in early-stage healthcare systems is choosing between microservices and a modular monolith. For the ElderGuardian AI MVP and growth phases (0–100,000 active patients), the **Modular Monolith** architecture is strictly superior.

```
+---------------------------------------------------------------------------------------------------+
|                                  ARCHITECTURAL TRADE-OFF ANALYSIS                                  |
+------------------------------+----------------------------------+---------------------------------+
| Architectural Dimension      | Microservices Pattern            | Modular Monolith Pattern (Chosen)|
+------------------------------+----------------------------------+---------------------------------+
| Operational Complexity       | Extreme (Service mesh, K8s,      | Low (Single container/runtime,  |
|                              | distributed tracing, DNS)        | simple CI/CD pipeline)          |
+------------------------------+----------------------------------+---------------------------------+
| Data Consistency & ACID      | Eventual consistency, complex    | Guaranteed ACID transactions    |
|                              | Saga/2PC, partial failure states | across bounded module domains   |
+------------------------------+----------------------------------+---------------------------------+
| HIPAA / ePHI Audit Surface   | Fragmented across N databases;   | Centralized audit trail,        |
|                              | VPC peering & mTLS mandatory     | unified access control boundary |
+------------------------------+----------------------------------+---------------------------------+
| Developer Velocity & Refactor| High drag: Cross-service HTTP/   | High speed: Refactoring via TS  |
|                              | gRPC contracts, version drift    | interfaces & shared compiler    |
+------------------------------+----------------------------------+---------------------------------+
| Infrastructure MVP Cost      | $600 - $2,500/month baseline     | $40 - $120/month baseline       |
+------------------------------+----------------------------------+---------------------------------+
| Latency Overhead             | Network serialization (JSON/gRPC)| In-process memory execution     |
|                              | per inter-service call           | (sub-millisecond function calls)|
+------------------------------+----------------------------------+---------------------------------+
```

#### Why Modular Monolith for Core Business Logic:
1. **Clinical Data Integrity (ACID Boundaries):** Healthcare actions such as creating an appointment, verifying a prescription, and locking a refill order must commit atomically. In microservices, distributed transactions across Patient, Appointment, and Refill services introduce eventual consistency vulnerabilities where clinical records can become desynchronized during network partitions.
2. **Simplified Regulatory & Compliance Audit Surface:** HIPAA and HITECH require strict accounting of every access and mutation of Electronic Protected Health Information (ePHI). A modular monolith permits a single, hardened database audit logging trigger and unified middleware security stack, eliminating data leakage between microservice boundary hops.
3. **Preserved Evolutionary Path:** Code is strictly segregated into domain directories (`/modules/auth`, `/modules/prescription`, etc.) communicating exclusively through defined TypeScript interfaces and domain events. If a specific module (e.g., `notification-module` or `analytics-module`) ever requires independent horizontal scaling, it can be extracted into an independent microservice with zero domain refactoring.

#### Why a Separate Python ML Microservice is Justified:
While business workflows belong in the monolith, Machine Learning belongs in Python:
- **Ecosystem Hegemony:** The cutting-edge computer vision (OpenCV, Tesseract, EasyOCR) and NLP/medical entity extraction libraries (spaCy, Transformers, HuggingFace, scikit-learn) have first-class Python support.
- **Resource Segregation:** OCR and ML inference are CPU/GPU-bound and memory-intensive. Running heavy image matrix transformations inside the Node.js event loop would freeze asynchronous I/O and degrade API response times for all concurrent users.
- **Stateless Scaling:** The ML service is completely stateless; it can scale from 0 to N worker pods or be pinned to GPU-optimized compute instances independently of the transactional database and API web tier.

---

### 1.3 High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientTier["Client Tier (Web Browser / Mobile PWA)"]
        SPA["React.js SPA (ElderGuardian UI)\n- Senior Portal (Accessible High-Contrast)\n- Family Caregiver Dashboard\n- Doctor & Clinic Console\n- Pharmacy & Admin Portal"]
    end

    subgraph IngressTier["Ingress & Perimeter Security"]
        LB["Reverse Proxy & TLS Termination\n(Nginx / Caddy / Cloudflare WAF)\nEnforces HTTPS, Rate Limiting, DDoS Shield"]
    end

    subgraph CoreBackend["Application Tier: Node.js Modular Monolith (Express + TypeScript)"]
        direction TB
        MW["Express Gateway Middleware Stack\n[CorrelationID] -> [Helmet] -> [CORS] -> [RateLimiter] -> [JWT/RBAC Auth] -> [AuditLogger]"]
        
        subgraph InternalModules["Internal Domain Modules (Strict Isolation)"]
            direction TB
            M_AUTH["auth-module"]
            M_PAT["patient-module"]
            M_HOSP["hospital-module"]
            M_APP["appointment-module"]
            M_PRE["prescription-module"]
            M_MED["medication-module"]
            M_REF["refill-module"]
            M_PHAR["pharmacy-module"]
            M_HLT["health-module"]
            M_NOT["notification-module"]
            M_ANA["analytics-module"]
        end

        EVT["In-Process Event Bus (Domain Events)\n(EventEmitter2 / Typings Safe)"]
        
        ADAPT["External Integration Adapter Layer\n(Pluggable Interface Implementations)"]
    end

    subgraph MLService["Intelligence Tier: Python ML Microservice (FastAPI + Uvicorn)"]
        direction TB
        FASTAPI["FastAPI REST Controller\n(Bearer Token Auth, Pydantic v2 Validation)"]
        OCR_ENGINE["Prescription OCR Engine\n(OpenCV + EasyOCR / Tesseract)"]
        NLP_ENGINE["Clinical NLP Extractor\n(spaCy Medical NER + RxNorm Fuzzy Matcher)"]
        ADH_MODEL["Adherence Predictor\n(XGBoost Compliance Classifier)"]
        DEP_MODEL["Depletion Predictor\n(Inventory Burn-Down Calculator)"]
    end

    subgraph DataStorage["Data Persistence Tier"]
        DB[("Primary Relational Database\nSQLite (Dev) / PostgreSQL 15+ (Prod)\nEncrypted at Rest (AES-256 / KMS)")]
        FS[("Object File Storage\nLocal FS (Dev) / AWS S3 (Prod)\nPrescription Images & PDF Reports")]
        REDIS[("In-Memory Store (Future/Phase 2)\nRedis Cache & BullMQ Job Queues\nScheduled Cron & Reminders")]
    end

    subgraph ExternalServices["External Services (Simulated / Live)"]
        EXT_PHARM["External Retail Pharmacy API\n(Mock Partner Gateway / Surescripts)"]
        EXT_SMS["SMS Gateway (Twilio Stub)"]
        EXT_MAIL["Email Gateway (SendGrid Stub)"]
        EXT_EHR["Hospital EHR / EMR System\n(FHIR R4 Adapter - Future)"]
    end

    %% Client communication
    SPA -->|HTTPS / JSON REST / WSS| LB
    LB -->|Reverse Proxy HTTP/1.1| MW
    MW --> InternalModules

    %% Intra-monolith communication
    InternalModules <--> EVT
    InternalModules --> ADAPT

    %% Monolith to Storage
    InternalModules -->|TypeORM / Kysely Query Builder| DB
    M_PRE -->|Upload / Download Stream| FS
    InternalModules -.->|Caching & Delayed Jobs| REDIS

    %% Monolith to ML Service
    M_PRE -->|Internal REST (mTLS / Shared Secret)| FASTAPI
    M_REF -->|Internal REST (Depletion Calculation)| FASTAPI
    M_MED -->|Internal REST (Adherence Risk Scoring)| FASTAPI

    %% ML Engine Pipeline
    FASTAPI --> OCR_ENGINE
    FASTAPI --> NLP_ENGINE
    FASTAPI --> ADH_MODEL
    FASTAPI --> DEP_MODEL

    %% External Adapters
    ADAPT -->|HTTPS Outbound| EXT_PHARM
    ADAPT -->|HTTPS Outbound| EXT_SMS
    ADAPT -->|HTTPS Outbound| EXT_MAIL
    ADAPT -.->|HL7 / FHIR REST| EXT_EHR

    %% Styles
    classDef client fill:#E0F2FE,stroke:#0284C7,stroke-width:2px,color:#0369A1;
    classDef ingress fill:#F1F5F9,stroke:#475569,stroke-width:2px,color:#1E293B;
    classDef backend fill:#F0FDF4,stroke:#16A34A,stroke-width:2px,color:#15803D;
    classDef ml fill:#FAF5FF,stroke:#9333EA,stroke-width:2px,color:#6B21A8;
    classDef storage fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#92400E;
    classDef ext fill:#FFF1F2,stroke:#E11D48,stroke-width:2px,color:#9F1239;

    class SPA client;
    class LB ingress;
    class CoreBackend,MW,InternalModules,EVT,ADAPT backend;
    class MLService,FASTAPI,OCR_ENGINE,NLP_ENGINE,ADH_MODEL,DEP_MODEL ml;
    class DB,FS,REDIS storage;
    class ExternalServices,EXT_PHARM,EXT_SMS,EXT_MAIL,EXT_EHR ext;
```

---

### 1.4 System Topology & Core Subsystems

| Tier | Component | Technology / Stack | Primary Role |
| :--- | :--- | :--- | :--- |
| **Presentation Tier** | Web SPA / Mobile PWA | React 18, TypeScript, Tailwind CSS, Lucide Icons | Responsive client application with tailored views for elderly patients, family members, doctors, and pharmacy admins. |
| **Edge Tier** | Reverse Proxy & WAF | Nginx / Caddy | SSL/TLS termination, rate limiting, gzip/brotli compression, static file caching, and request proxying. |
| **API Application Tier** | Modular Monolith API | Node.js 20 LTS, Express, TypeScript | Houses all business rules, domain entities, transaction coordination, and external adapters. |
| **Intelligence Tier** | ML Microservice | Python 3.11, FastAPI, Uvicorn, EasyOCR, spaCy | Asynchronous and synchronous image processing, clinical text extraction, and predictive inference. |
| **Persistence Tier** | Primary Relational DB | SQLite (Dev) / PostgreSQL 15+ (Prod) | ACID-compliant relational data store with relational constraints, foreign keys, and audit logs. |
| **Object Store** | Unstructured Storage | Local File System (Dev) / AWS S3 (Prod) | Secure storage for encrypted prescription scans, medical lab PDFs, and profile avatars. |
| **Cache & Queue Tier** | Message Broker & Cache | Redis 7+ (Phase 2) / In-Memory (MVP) | Session blacklisting, rate limiting counters, and scheduled cron jobs for medication reminder dispatches. |

---

# 2. BACKEND MODULE ARCHITECTURE

### 2.1 Modular Monolith Architectural Pattern
To prevent the Node.js monolith from decaying into a "big ball of mud," the codebase adheres to strict Domain-Driven Design (DDD) module boundaries:
- **Encapsulation:** Each module resides in its own isolated folder (`src/modules/<module-name>`) containing its own controllers, services, repositories, and domain models.
- **No Direct Table Spanning:** A module may query only tables that it explicitly **owns**. If `refill-module` requires patient medical history, it must call the public service interface of `patient-module` or react to a domain event emitted by `patient-module`.
- **Interface Segregation:** Cross-module communication occurs via strongly typed public service interfaces exported from the module's index file (e.g., `PatientModulePublicService.ts`).
- **Database Isolation via Schema / Table Prefixes:** Tables are prefixed by their module namespace (e.g., `auth_users`, `pat_patients`, `med_schedules`, `ref_orders`) ensuring zero namespace collisions and clean future migration paths to microservices if ever required.

---

### 2.2 In-Process Event Bus Architecture
Cross-module side effects execute asynchronously through an in-process, type-safe Domain Event Bus implemented via `EventEmitter2`:
- **Decoupling:** When a prescription is approved, `prescription-module` emits `PrescriptionApprovedEvent`. It does not know or care that `medication-module` consumes this event to build daily schedules, or that `notification-module` consumes it to alert the family caregiver.
- **Failure Isolation:** Handler failures in downstream consumers do not roll back the primary transactional write unless explicitly configured in an orchestration pipeline.

```mermaid
flowchart LR
    subgraph PublisherModule["Prescription Module"]
        P_SVC["PrescriptionService"] -->|emit| EB["In-Process Event Bus\n(EventEmitter2)"]
    end

    subgraph ConsumerModules["Subscribed Modules"]
        EB -->|on 'prescription.approved'| M_SVC["MedicationService\n(Generates Schedules)"]
        EB -->|on 'prescription.approved'| R_SVC["RefillService\n(Initializes Stock Horizon)"]
        EB -->|on 'prescription.approved'| N_SVC["NotificationService\n(Sends SMS to Caregiver)"]
    end
```

---

### 2.3 Detailed Module Specifications

Below is the exhaustive architectural specification for each of the 11 backend modules.

```
+--------------------------------------------------------------------------------------------------+
|                                  MODULAR DOMAIN OVERVIEW MATRIX                                  |
+----+----------------------+--------------------------------------------------+-------------------+
| #  | Module Name          | Primary Domain Scope                             | Database Tables   |
+----+----------------------+--------------------------------------------------+-------------------+
| 01 | auth-module          | Authentication, Sessions, Passwordless, RBAC     | 3 tables          |
| 02 | patient-module       | Patient Demographics, Guardianship, Consent      | 3 tables          |
| 03 | hospital-module      | Hospitals, Clinics, Doctor Profiles, Licensing   | 2 tables          |
| 04 | appointment-module   | Booking Slots, Scheduling, Cancellations         | 2 tables          |
| 05 | prescription-module  | Digital Scans, ML Status, Versioning, Review     | 2 tables          |
| 06 | medication-module    | Schedules, Dose Logging, Adherence Tracking      | 3 tables          |
| 07 | refill-module        | Inventory Burn-Down, Depletion Alerts, Workflows | 2 tables          |
| 08 | pharmacy-module      | Retail Pharmacies, Fulfillment Orders, Tracking  | 2 tables          |
| 09 | health-module        | Vitals (BP, Glucose, O2), Symptom Logs, Trends   | 2 tables          |
| 10 | notification-module  | In-App Feeds, Multi-Channel Dispatch (SMS, Mail) | 2 tables          |
| 11 | analytics-module     | Adherence Metrics, Clinical Cohort Aggregations  | 2 tables          |
+----+----------------------+--------------------------------------------------+-------------------+
```

---

#### Module 1: `auth-module`
* **Domain Responsibility:** User identity lifecycle, secure credential hashing, JWT access token issuance, refresh token rotation, multi-factor authentication (MFA/TOTP), session invalidation, and Role-Based Access Control (RBAC) enforcement.
* **Roles Supported:** `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DOCTOR`, `PATIENT`, `CAREGIVER`, `PHARMACIST`.
* **Key Services:** `AuthService`, `TokenService`, `PasswordService`, `RbacPolicyEngine`, `SessionManager`.
* **Database Tables Owned:**
  * `auth_users`: `id (UUID PK)`, `email (VARCHAR UNIQUE)`, `phone_number (VARCHAR UNIQUE)`, `password_hash (VARCHAR)`, `role (VARCHAR)`, `is_active (BOOLEAN)`, `mfa_secret (VARCHAR NULL)`, `mfa_enabled (BOOLEAN DEFAULT FALSE)`, `created_at`, `updated_at`, `deleted_at`.
  * `auth_refresh_tokens`: `id (UUID PK)`, `user_id (UUID FK -> auth_users.id)`, `token_hash (VARCHAR UNIQUE)`, `family_id (UUID)`, `is_revoked (BOOLEAN)`, `expires_at (TIMESTAMP)`, `created_at`.
  * `auth_audit_logs`: `id (BIGSERIAL PK)`, `user_id (UUID NULL)`, `event_type (VARCHAR)`, `ip_address (VARCHAR)`, `user_agent (TEXT)`, `status (VARCHAR)`, `created_at`.
* **Events Emitted:**
  * `auth.user_registered`: `{ userId, email, role, timestamp }`
  * `auth.login_succeeded`: `{ userId, ipAddress, timestamp }`
  * `auth.token_reused_alert`: `{ userId, familyId, ipAddress }` (Triggers security revocation)
  * `auth.password_reset_requested`: `{ userId, email, resetToken }`
* **Events Consumed:** None.

---

#### Module 2: `patient-module`
* **Domain Responsibility:** Core geriatric demographic records, emergency medical data (allergies, chronic conditions, blood group), legal consent tracking under HIPAA/GDPR, and patient-caregiver proxy relationships.
* **Key Services:** `PatientProfileService`, `CaregiverLinkService`, `ConsentManagementService`.
* **Database Tables Owned:**
  * `pat_profiles`: `id (UUID PK)`, `user_id (UUID UNIQUE FK -> auth_users.id)`, `first_name (VARCHAR)`, `last_name (VARCHAR)`, `date_of_birth (DATE)`, `gender (VARCHAR)`, `blood_type (VARCHAR)`, `emergency_contact_name (VARCHAR)`, `emergency_contact_phone (VARCHAR)`, `address_line (TEXT)`, `created_at`, `updated_at`.
  * `pat_medical_history`: `id (UUID PK)`, `patient_id (UUID FK -> pat_profiles.id)`, `condition_name (VARCHAR)`, `icd10_code (VARCHAR NULL)`, `diagnosed_date (DATE NULL)`, `notes (TEXT)`, `created_at`.
  * `pat_caregiver_links`: `id (UUID PK)`, `patient_id (UUID FK -> pat_profiles.id)`, `caregiver_user_id (UUID FK -> auth_users.id)`, `relationship (VARCHAR)`, `access_level (VARCHAR: READ_ONLY, FULL_DELEGATE)`, `is_verified (BOOLEAN)`, `created_at`, `updated_at`.
  * `pat_consent_records`: `id (UUID PK)`, `patient_id (UUID FK -> pat_profiles.id)`, `consent_type (VARCHAR)`, `granted_to_user_id (UUID)`, `status (VARCHAR: GRANTED, REVOKED)`, `signed_at (TIMESTAMP)`, `ip_address (VARCHAR)`.
* **Events Emitted:**
  * `patient.profile_created`: `{ patientId, userId, timestamp }`
  * `patient.caregiver_linked`: `{ patientId, caregiverUserId, accessLevel }`
  * `patient.consent_revoked`: `{ patientId, revokedUserId, consentType }`
* **Events Consumed:**
  * `auth.user_registered`: Creates draft patient profile when registered role is `PATIENT`.

---

#### Module 3: `hospital-module`
* **Domain Responsibility:** Directory of clinical organizations (hospitals, outpatient clinics), physical facilities, clinical departments, doctor affiliations, and physician medical license credentials.
* **Key Services:** `HospitalService`, `DoctorProfileService`, `DepartmentService`.
* **Database Tables Owned:**
  * `hosp_organizations`: `id (UUID PK)`, `name (VARCHAR)`, `registration_number (VARCHAR UNIQUE)`, `phone (VARCHAR)`, `email (VARCHAR)`, `address (TEXT)`, `is_active (BOOLEAN)`, `created_at`.
  * `hosp_doctors`: `id (UUID PK)`, `user_id (UUID UNIQUE FK -> auth_users.id)`, `hospital_id (UUID FK -> hosp_organizations.id)`, `medical_license_number (VARCHAR UNIQUE)`, `specialty (VARCHAR)`, `consultation_fee (DECIMAL(10,2))`, `is_verified (BOOLEAN)`, `created_at`, `updated_at`.
* **Events Emitted:**
  * `hospital.doctor_verified`: `{ doctorId, hospitalId, licenseNumber }`
  * `hospital.doctor_status_changed`: `{ doctorId, isActive }`
* **Events Consumed:** None.

---

#### Module 4: `appointment-module`
* **Domain Responsibility:** Doctor scheduling availability windows, patient booking reservations, automated conflict detection, status lifecycle management (PENDING, CONFIRMED, COMPLETED, CANCELLED), and appointment reminders.
* **Key Services:** `AppointmentBookingService`, `SlotScheduleService`, `ReminderCoordinationService`.
* **Database Tables Owned:**
  * `app_doctor_slots`: `id (UUID PK)`, `doctor_id (UUID FK -> hosp_doctors.id)`, `start_time (TIMESTAMP)`, `end_time (TIMESTAMP)`, `is_booked (BOOLEAN DEFAULT FALSE)`, `created_at`.
  * `app_appointments`: `id (UUID PK)`, `patient_id (UUID FK -> pat_profiles.id)`, `doctor_id (UUID FK -> hosp_doctors.id)`, `slot_id (UUID UNIQUE FK -> app_doctor_slots.id)`, `appointment_type (VARCHAR: IN_PERSON, TELEHEALTH)`, `status (VARCHAR)`, `reason_for_visit (TEXT)`, `cancellation_reason (TEXT NULL)`, `created_at`, `updated_at`.
* **Events Emitted:**
  * `appointment.booked`: `{ appointmentId, patientId, doctorId, startTime }`
  * `appointment.confirmed`: `{ appointmentId, patientId, doctorId }`
  * `appointment.cancelled`: `{ appointmentId, patientId, doctorId, reason }`
* **Events Consumed:**
  * `notification.reminder_due`: Triggers reminder notifications 24 hours and 2 hours prior to start time.

---

#### Module 5: `prescription-module`
* **Domain Responsibility:** Ingestion and secure storage of prescription images/PDFs, dispatch to Python ML service for OCR/NLP extraction, manual physician verification/correction workflow, clinical versioning, and immutable audit history.
* **Key Services:** `PrescriptionStorageService`, `PrescriptionMLOrchestrator`, `PrescriptionVerificationService`.
* **Database Tables Owned:**
  * `rx_prescriptions`: `id (UUID PK)`, `patient_id (UUID FK -> pat_profiles.id)`, `doctor_id (UUID NULL FK -> hosp_doctors.id)`, `file_key (VARCHAR)`, `file_mime (VARCHAR)`, `ocr_status (VARCHAR: PENDING, PROCESSED, FAILED)`, `review_status (VARCHAR: DRAFT, APPROVED, REJECTED)`, `reviewed_by_doctor_id (UUID NULL)`, `raw_ocr_payload (JSONB NULL)`, `created_at`, `updated_at`.
  * `rx_items`: `id (UUID PK)`, `prescription_id (UUID FK -> rx_prescriptions.id)`, `raw_extracted_name (VARCHAR)`, `normalized_drug_name (VARCHAR)`, `rxnorm_code (VARCHAR NULL)`, `dosage (VARCHAR)`, `frequency (VARCHAR)`, `route (VARCHAR)`, `duration_days (INT)`, `dispensed_quantity (INT)`, `refills_allowed (INT DEFAULT 0)`, `created_at`.
* **Events Emitted:**
  * `prescription.uploaded`: `{ prescriptionId, patientId, fileKey }`
  * `prescription.ocr_completed`: `{ prescriptionId, extractedItemCount }`
  * `prescription.approved`: `{ prescriptionId, patientId, doctorId, items: [...] }`
* **Events Consumed:** None.

---

#### Module 6: `medication-module`
* **Domain Responsibility:** Translation of approved prescription items into active patient medication schedules, dosage calculation, real-time reminder triggers, adherence confirmation logging (TAKEN, MISSED, SNOOZED, SKIPPED), and side-effect reporting.
* **Key Services:** `ScheduleGeneratorService`, `DoseLogService`, `AdherenceCalculationService`.
* **Database Tables Owned:**
  * `med_active_medications`: `id (UUID PK)`, `patient_id (UUID FK -> pat_profiles.id)`, `prescription_item_id (UUID UNIQUE FK -> rx_items.id)`, `drug_name (VARCHAR)`, `dosage (VARCHAR)`, `instructions (TEXT)`, `start_date (DATE)`, `end_date (DATE NULL)`, `is_active (BOOLEAN DEFAULT TRUE)`, `created_at`.
  * `med_schedules`: `id (UUID PK)`, `medication_id (UUID FK -> med_active_medications.id)`, `time_of_day (TIME)`, `days_of_week (VARCHAR[])`, `dosage_units (DECIMAL(4,2))`, `created_at`.
  * `med_dose_logs`: `id (UUID PK)`, `schedule_id (UUID FK -> med_schedules.id)`, `patient_id (UUID FK -> pat_profiles.id)`, `scheduled_time (TIMESTAMP)`, `actual_time (TIMESTAMP NULL)`, `status (VARCHAR: TAKEN, MISSED, SKIPPED, SNOOZED)`, `logged_by_user_id (UUID)`, `notes (TEXT NULL)`, `created_at`.
* **Events Emitted:**
  * `medication.dose_taken`: `{ patientId, medicationId, scheduledTime, actualTime }`
  * `medication.dose_missed`: `{ patientId, medicationId, scheduledTime }`
  * `medication.adherence_threshold_breached`: `{ patientId, rollingAdherencePct }`
* **Events Consumed:**
  * `prescription.approved`: Translates clinical items into active schedules and dose intervals.

---

#### Module 7: `refill-module`
* **Domain Responsibility:** Continuous tracking of medication pill inventory, automated depletion calculation, replenishment alert generation, multi-party refill approval workflow (Patient -> Caregiver -> Physician), and handoff to pharmacy fulfillment.
* **Key Services:** `DepletionDetectorService`, `RefillWorkflowManager`, `RefillApprovalService`.
* **Database Tables Owned:**
  * `ref_inventories`: `id (UUID PK)`, `medication_id (UUID UNIQUE FK -> med_active_medications.id)`, `patient_id (UUID FK -> pat_profiles.id)`, `initial_quantity (INT)`, `remaining_quantity (DECIMAL(6,2))`, `estimated_depletion_date (DATE)`, `last_recalculated_at (TIMESTAMP)`, `created_at`, `updated_at`.
  * `ref_requests`: `id (UUID PK)`, `inventory_id (UUID FK -> ref_inventories.id)`, `patient_id (UUID FK -> pat_profiles.id)`, `status (VARCHAR: PENDING_APPROVAL, DOCTOR_APPROVED, ORDER_PLACED, FULFILLED, REJECTED)`, `urgency_level (VARCHAR: NORMAL, URGENT, EMERGENCY)`, `doctor_notes (TEXT NULL)`, `created_at`, `updated_at`.
* **Events Emitted:**
  * `refill.depletion_warning`: `{ patientId, medicationId, daysRemaining, estimatedDepletionDate }`
  * `refill.approval_requested`: `{ refillRequestId, patientId, doctorId }`
  * `refill.approved`: `{ refillRequestId, patientId, medicationId, quantity }`
* **Events Consumed:**
  * `medication.dose_taken`: Decrements `remaining_quantity` in `ref_inventories` by the dosage amount.
  * `prescription.approved`: Initializes or updates the medication inventory baseline.

---

#### Module 8: `pharmacy-module`
* **Domain Responsibility:** Directory of dispensing pharmacies, purchase order generation, external pharmacy API dispatch (via adapter), order state synchronization, and delivery tracking.
* **Key Services:** `PharmacyDirectoryService`, `OrderManagementService`, `PharmacyDispatchService`.
* **Database Tables Owned:**
  * `phar_pharmacies`: `id (UUID PK)`, `name (VARCHAR)`, `chain_identifier (VARCHAR NULL)`, `license_number (VARCHAR)`, `phone (VARCHAR)`, `email (VARCHAR)`, `api_adapter_type (VARCHAR: MOCK, SURE_SCRIPTS, GENERIC_REST)`, `created_at`.
  * `phar_orders`: `id (UUID PK)`, `refill_request_id (UUID FK -> ref_requests.id)`, `pharmacy_id (UUID FK -> phar_pharmacies.id)`, `external_order_id (VARCHAR NULL)`, `status (VARCHAR: DISPATCHED, PROCESSING, READY_FOR_PICKUP, DELIVERED, CANCELLED)`, `tracking_url (TEXT NULL)`, `created_at`, `updated_at`.
* **Events Emitted:**
  * `pharmacy.order_placed`: `{ orderId, pharmacyId, refillRequestId }`
  * `pharmacy.order_status_updated`: `{ orderId, externalOrderId, newStatus }`
* **Events Consumed:**
  * `refill.approved`: Generates a `phar_orders` record and dispatches it via the selected pharmacy adapter.

---

#### Module 9: `health-module`
* **Domain Responsibility:** Ingestion and clinical range evaluation for geriatric biometric readings (blood pressure, blood glucose, pulse oximetry, heart rate, body weight), anomaly detection, and historical trend computation.
* **Key Services:** `VitalsIngestionService`, `ClinicalRangeEvaluator`, `TrendAnalysisService`.
* **Database Tables Owned:**
  * `hlt_vitals`: `id (UUID PK)`, `patient_id (UUID FK -> pat_profiles.id)`, `metric_type (VARCHAR: BLOOD_PRESSURE, GLUCOSE, SPO2, HEART_RATE, WEIGHT)`, `value_numeric_1 (DECIMAL(6,2))`, `value_numeric_2 (DECIMAL(6,2) NULL)`, `unit (VARCHAR)`, `is_abnormal (BOOLEAN)`, `recorded_at (TIMESTAMP)`, `created_at`.
  * `hlt_symptom_reports`: `id (UUID PK)`, `patient_id (UUID FK -> pat_profiles.id)`, `symptom_name (VARCHAR)`, `severity (INT: 1-10)`, `notes (TEXT NULL)`, `logged_at (TIMESTAMP)`, `created_at`.
* **Events Emitted:**
  * `health.vital_abnormal_detected`: `{ patientId, metricType, values, timestamp }`
  * `health.symptom_reported`: `{ patientId, symptomName, severity }`
* **Events Consumed:** None.

---

#### Module 10: `notification-module`
* **Domain Responsibility:** Centralized multi-channel alert delivery (in-app notifications, SMS, email), recipient preference filtering, quiet hours enforcement, and delivery failure fallbacks.
* **Key Services:** `NotificationDispatcherService`, `TemplateEngine`, `PreferenceResolverService`.
* **Database Tables Owned:**
  * `not_notifications`: `id (UUID PK)`, `user_id (UUID FK -> auth_users.id)`, `channel (VARCHAR: IN_APP, SMS, EMAIL)`, `title (VARCHAR)`, `message (TEXT)`, `priority (VARCHAR: LOW, MEDIUM, HIGH, CRITICAL)`, `is_read (BOOLEAN DEFAULT FALSE)`, `delivery_status (VARCHAR: PENDING, DELIVERED, FAILED)`, `created_at`.
  * `not_user_preferences`: `id (UUID PK)`, `user_id (UUID UNIQUE FK -> auth_users.id)`, `enable_sms (BOOLEAN DEFAULT TRUE)`, `enable_email (BOOLEAN DEFAULT TRUE)`, `enable_push (BOOLEAN DEFAULT TRUE)`, `quiet_hours_start (TIME NULL)`, `quiet_hours_end (TIME NULL)`, `created_at`, `updated_at`.
* **Events Emitted:**
  * `notification.delivery_failed`: `{ notificationId, userId, channel, reason }`
* **Events Consumed:**
  * `appointment.booked`: Dispatches confirmation to patient and doctor.
  * `medication.dose_missed`: Sends urgent alerts to linked family caregivers.
  * `refill.depletion_warning`: Notifies patient and caregiver of upcoming medication shortage.
  * `health.vital_abnormal_detected`: Pushes urgent clinical alert to primary care physician.

---

#### Module 11: `analytics-module`
* **Domain Responsibility:** Aggregation of platform metrics, calculation of clinical adherence rates (Proportion of Days Covered - PDC), doctor workload reporting, and executive summary exports.
* **Key Services:** `AdherenceAggregatorService`, `ClinicalMetricsReporter`, `AuditExportService`.
* **Database Tables Owned:**
  * `ana_daily_patient_metrics`: `id (BIGSERIAL PK)`, `patient_id (UUID FK -> pat_profiles.id)`, `metric_date (DATE)`, `doses_scheduled (INT)`, `doses_taken (INT)`, `adherence_rate (DECIMAL(5,2))`, `vitals_recorded_count (INT)`, `created_at`.
  * `ana_system_health`: `id (BIGSERIAL PK)`, `snapshot_time (TIMESTAMP)`, `active_patients (INT)`, `pending_refills (INT)`, `unreviewed_prescriptions (INT)`, `avg_api_latency_ms (INT)`.
* **Events Emitted:** None (Read-only reporting domain).
* **Events Consumed:**
  * `medication.dose_taken`, `medication.dose_missed`, `refill.approved`, `appointment.completed`.

---

# 3. ML SERVICE ARCHITECTURE

### 3.1 Microservice Overview & Tech Stack
The **ElderGuardian ML Service** is an autonomous Python 3.11 service built using the **FastAPI** framework and hosted on **Uvicorn** ASGI workers. It provides synchronous and asynchronous inference endpoints for computer vision, biomedical Natural Language Processing (NLP), and statistical risk prediction.

```
+--------------------------------------------------------------------------------------------------+
|                                  ML MICROSERVICE TECHNOLOGY STACK                                |
+------------------------------+-------------------------------------------------------------------+
| Component Layer              | Technology / Framework Selection                                  |
+------------------------------+-------------------------------------------------------------------+
| Web API Framework            | Python 3.11 + FastAPI (Async route handlers, Pydantic v2 schemas)  |
| Image Processing Pipeline    | OpenCV (cv2) + Pillow + NumPy                                     |
| Optical Character Recognition| EasyOCR (PyTorch CUDA/CPU) / Tesseract OCR 5.3 (Fallback Engine)  |
| NLP & Medical Entity Mining  | spaCy (en_core_med7_lg / en_ner_bc5cdr_md) + Transformers         |
| Drug Ontology & Fuzzy Match  | RapidFuzz (Levenshtein) + Local RxNorm / WHO-ATC SQLite Lookup    |
| Predictive Machine Learning  | scikit-learn + XGBoost + LightGBM                                 |
+------------------------------+-------------------------------------------------------------------+
```

---

### 3.2 Prescription OCR Pipeline

Prescriptions uploaded by elderly patients or caregivers frequently suffer from low illumination, motion blur, non-planar rotation, and paper crumpling. The ML service executes a 5-stage computer vision preprocessing pipeline before text recognition:

```mermaid
flowchart TD
    IMG_IN["Input Prescription Image\n(JPEG/PNG/PDF Stream)"] --> P1["1. Resolution Normalization\n(Resize to min 300 DPI baseline)"]
    P1 --> P2["2. Grayscale & Noise Filtering\n(Bilateral Filter: removes noise,\npreserves handwriting edges)"]
    P2 --> P3["3. Orientation & Deskewing\n(Hough Line Transform / cv2.minAreaRect)"]
    P3 --> P4["4. Adaptive Thresholding\n(Otsu's Binarization & Shadow Removal)"]
    P4 --> P5["5. Morphological Dilation\n(Connect broken characters)"]
    P5 --> OCR_RUN["Dual-Pass OCR Engine\n- Pass 1: EasyOCR (Scene Text & Handwriting)\n- Pass 2: Tesseract 5 (Printed Text Blocks)"]
    OCR_RUN --> BBOX_MERGE["Bounding Box Clustering & Line Assembly\n(Merge adjacent spatial word tokens into phrases)"]
    BBOX_MERGE --> RAW_TOKENS["Structured Raw Text & Bounding Boxes\n{ text, confidence, bbox: [x, y, w, h] }"]
```

---

### 3.3 Medicine Name & Dosage NLP Extraction

Once raw text lines are extracted, a specialized clinical NLP pipeline isolates structured pharmacological parameters:

```mermaid
flowchart LR
    RAW_TEXT["Extracted Text Lines\ne.g., 'Metformin 500mg PO BID with meals #60'"] --> NER["Clinical NER Engine\n(spaCy Bio-Medical Pipeline)"]
    
    NER --> TAGS["Entity Tagging\n- DRUG: Metformin\n- STRENGTH: 500mg\n- ROUTE: Oral (PO)\n- FREQ: Twice Daily (BID)\n- QTY: 60"]
    
    TAGS --> ONTOLOGY["RxNorm / Formulary Normalization\n(Fuzzy Levenshtein Similarity >= 85%)\nMatches to RxCUI: 860975"]
    
    ONTOLOGY --> STRUCT_JSON["Validated Prescription Item JSON\nReady for Doctor Review"]
```

#### Extraction Schema (Pydantic Model Output):
```json
{
  "drug_name": "Metformin Hydrochloride",
  "rxnorm_code": "860975",
  "dosage_form": "Tablet",
  "strength": "500 mg",
  "frequency_code": "BID",
  "frequency_human": "Twice daily with meals",
  "route": "ORAL",
  "duration_days": 30,
  "dispense_quantity": 60,
  "confidence_score": 0.94
}
```

---

### 3.4 Adherence Prediction Engine

* **Objective:** Predict the probability $P(\text{Non-Adherence} > 20\%)$ over the subsequent 14-day horizon.
* **Model Type:** Gradient Boosted Decision Trees (**XGBoost Classifier**).
* **Feature Vector ($X$):**
  1. *Regimen Complexity:* Total pills/day, distinct medication count, schedule frequency variance.
  2. *Historical Adherence:* Proportion of Days Covered (PDC) over past 30, 60, and 90 days.
  3. *Temporal Features:* Day of week patterns, missed dose clustering (e.g., weekend lapse rate).
  4. *Patient Factors:* Age group, reported side effects count, caregiver active-link status (binary).
  5. *Refill Behavior:* Days delayed in previous refill requests.
* **Output:** Risk Tier (`LOW`, `MODERATE`, `HIGH`) + Top 3 contributing risk factors (via SHAP values) provided to the attending physician.

---

### 3.5 Medication Depletion Engine

The depletion engine calculates the continuous burn-down curve of medication supply, preventing drug gaps without requiring manual inventory counting.

$$\text{Depletion Date } (T_{\text{deplete}}) = T_{\text{last\_verified}} + \left( \frac{Q_{\text{current}}}{\mu_{\text{daily\_consumption}} \times (1 + \sigma_{\text{as\_needed\_variance}})} \right)$$

$$\text{Reorder Trigger Date } (T_{\text{trigger}}) = T_{\text{deplete}} - \left( L_{\text{pharmacy\_lead\_time}} + S_{\text{safety\_buffer\_days}} \right)$$

* **Parameters:**
  * $Q_{\text{current}}$: Current remaining units (tablets/capsules).
  * $\mu_{\text{daily\_consumption}}$: Scheduled daily dose (e.g., 2 tablets/day).
  * $\sigma_{\text{as\_needed\_variance}}$: Empirical variance factor for PRN (as-needed) medications.
  * $L_{\text{pharmacy\_lead\_time}}$: Historical fulfillment SLA for the selected pharmacy (default: 3 days).
  * $S_{\text{safety\_buffer\_days}}$: Built-in safety margin for elderly logistics (default: 4 days).
* **Automated Action:** When the current date reaches $T_{\text{trigger}}$, the Node.js monolith generates a `refill.depletion_warning` event.

---

### 3.6 Geriatric Risk Scoring (Future Roadmap)
In future releases, the ML service will incorporate a composite **Geriatric Deterioration Index (GDI)** aggregating:
1. Acute physiological changes (sudden pulse pressure narrowing, persistent SpO2 drops).
2. Cognitive deterioration proxies (frequency of app UI mis-taps, delayed response to reminder prompts).
3. Drug-Drug Interaction (DDI) risk matrices calculated across multi-specialist prescriptions.

---

### 3.7 Inter-Service Communication & API Contracts

Communication between the Node.js monolith and the Python ML service is strictly authenticated over private network channels via HTTP/REST with JSON payloads (or multipart for file uploads).

```
+----------------------------------------------------------------------------------------------------+
|                                  ML REST API ENDPOINT SPECIFICATIONS                                |
+-----------------------------------+--------+-----------------------------+-------------------------+
| Endpoint Route                    | Method | Request Payload             | Primary Response        |
+-----------------------------------+--------+-----------------------------+-------------------------+
| `/api/v1/ml/ocr/prescription`     | POST   | `multipart/form-data` (file)| `PrescriptionOcrResult` |
| `/api/v1/ml/nlp/extract-entities` | POST   | `{ raw_text: string }`      | `ExtractedEntitiesList` |
| `/api/v1/ml/predict/adherence`    | POST   | `AdherenceFeatureVector`    | `AdherencePrediction`   |
| `/api/v1/ml/predict/depletion`    | POST   | `DepletionInputParams`      | `DepletionCalculation`  |
| `/health`                         | GET    | None                        | `{ status: "HEALTHY" }` |
+-----------------------------------+--------+-----------------------------+-------------------------+
```

#### Fault Tolerance & Circuit Breaker (Node.js Side):
Calls from Node.js to the ML service are wrapped with the **Opossum Circuit Breaker**:
- **Timeout:** 15,000 ms for OCR endpoints; 2,500 ms for tabular predictions.
- **Error Threshold Percentage:** 50% failures over a 10-call sliding window opens the circuit.
- **Fallback Action:** If the ML service is unavailable, the prescription image is queued with status `OCR_PENDING_RETRY`, and human medical staff are notified via the admin console to perform manual transcription.

---

# 4. DATA FLOW DIAGRAMS

The following Mermaid sequence diagrams delineate the end-to-end data lifecycle across all key operational flows.

---

### 4.1 Patient Registration & Guardian Onboarding

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Elderly Patient / Caregiver
    participant SPA as React.js SPA
    participant GW as Express Gateway / Auth
    participant PM as Patient Module
    participant NM as Notification Module
    participant DB as Relational Database

    Patient->>SPA: 1. Fill registration (Name, Email, Role, Guardian Details)
    SPA->>GW: 2. POST /api/v1/auth/register
    GW->>DB: 3. Insert auth_users (hashed password)
    GW->>PM: 4. Emit 'auth.user_registered'
    PM->>DB: 5. Insert pat_profiles & draft pat_caregiver_links
    PM->>DB: 6. Insert pat_consent_records (HIPAA Terms Signed)
    PM->>NM: 7. Emit 'patient.profile_created'
    NM-->>Patient: 8. Dispatch Welcome Email & Caregiver Invitation SMS
    GW-->>SPA: 9. Return JWT Access Token + Set Secure Refresh Cookie
    SPA-->>Patient: 10. Display Guided Accessible Onboarding Dashboard
```

---

### 4.2 Appointment Booking Flow

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient / Caregiver
    participant SPA as React.js SPA
    participant AM as Appointment Module
    participant HM as Hospital Module
    participant DB as PostgreSQL Database
    participant NM as Notification Module

    Patient->>SPA: 1. Select Doctor & View Available Slots
    SPA->>AM: 2. GET /api/v1/appointments/slots?doctorId=X
    AM->>DB: 3. Query app_doctor_slots WHERE is_booked = FALSE
    DB-->>AM: 4. Available Slot Records
    AM-->>SPA: 5. Render Slots List

    Patient->>SPA: 6. Click 'Book Slot' (e.g., 10:00 AM)
    SPA->>AM: 7. POST /api/v1/appointments/book { slotId, reason }
    
    critical Atomic Booking Transaction
        AM->>DB: 8. SELECT * FROM app_doctor_slots WHERE id = slotId FOR UPDATE
        AM->>DB: 9. UPDATE app_doctor_slots SET is_booked = TRUE
        AM->>DB: 10. INSERT INTO app_appointments (status='CONFIRMED')
    end

    AM->>NM: 11. Emit 'appointment.booked'
    par Multi-Channel Notifications
        NM-->>Patient: 12. Send SMS Booking Confirmation with Calendar Link
        NM-->>HM: 13. Push Appointment to Doctor Console Feed
    end
    AM-->>SPA: 14. 201 Created { appointmentId, status: "CONFIRMED" }
    SPA-->>Patient: 15. Display Booking Confirmation Modal
```

---

### 4.3 Prescription Upload → Medication Schedule Creation

```mermaid
sequenceDiagram
    autonumber
    actor Caregiver as Family Caregiver
    participant SPA as React.js SPA
    participant RX as Prescription Module
    participant FS as S3 Object Storage
    participant ML as Python FastAPI ML Service
    actor Doctor as Attending Doctor
    participant MED as Medication Module
    participant DB as Database

    Caregiver->>SPA: 1. Upload prescription photo (camera/scan)
    SPA->>RX: 2. POST /api/v1/prescriptions/upload (multipart)
    RX->>FS: 3. Stream file to S3 (Encrypted SSE-KMS)
    RX->>DB: 4. INSERT INTO rx_prescriptions (status='OCR_PROCESSING')
    
    RX->>ML: 5. POST /api/v1/ml/ocr/prescription (Image Stream)
    activate ML
    Note over ML: Image Preprocessing, EasyOCR,<br/>and Clinical NLP Entity Extraction
    ML-->>RX: 6. Return Extracted Meds JSON (Drug, Dose, Freq, Qty)
    deactivate ML

    RX->>DB: 7. INSERT INTO rx_items & UPDATE status='PENDING_DOCTOR_REVIEW'
    RX-->>Doctor: 8. Alert Doctor Console: 'New Prescription Pending Verification'

    Doctor->>SPA: 9. Open Prescription Verification Workbench
    SPA->>RX: 10. GET /api/v1/prescriptions/:id/review
    Doctor->>SPA: 11. Adjust/Confirm Drug Name, Dosage & Sign Off
    SPA->>RX: 12. POST /api/v1/prescriptions/:id/approve

    RX->>DB: 13. UPDATE rx_prescriptions SET review_status='APPROVED'
    RX->>MED: 14. Emit 'prescription.approved' { patientId, items }
    
    critical Generate Schedules
        MED->>DB: 15. INSERT INTO med_active_medications
        MED->>DB: 16. INSERT INTO med_schedules (Morning 08:00, Night 20:00)
    end
    
    MED-->>Caregiver: 17. Notify: 'Prescription Approved! Daily Schedules Active'
```

---

### 4.4 Refill Coordination Flow (Detection → Approval → Fulfillment)

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Scheduled Daemon (Nightly)
    participant REF as Refill Module
    participant DB as PostgreSQL Database
    actor Caregiver as Family Caregiver
    actor Doctor as Attending Physician
    participant PHAR as Pharmacy Module
    participant ADAPT as Pharmacy API Adapter
    actor Pharmacy as Retail Pharmacy Partner

    Cron->>REF: 1. Trigger Nightly Inventory Depletion Scan
    REF->>DB: 2. Query Active Inventories & Calculate Days Remaining
    Note over REF: Medication X has 5 days remaining.<br/>Crosses Reorder Trigger Horizon!
    
    REF->>DB: 3. INSERT INTO ref_requests (status='PENDING_APPROVAL')
    REF->>Caregiver: 4. Push In-App Prompt: 'Refill needed for Metformin. Approve?'
    
    Caregiver->>REF: 5. Confirm Refill Request
    REF->>Doctor: 6. Push Clinical Authorization Request
    Doctor->>REF: 7. Doctor Electronically Authorizes Refill
    
    REF->>DB: 8. UPDATE ref_requests SET status='DOCTOR_APPROVED'
    REF->>PHAR: 9. Emit 'refill.approved' { refillRequestId, quantity }
    
    PHAR->>DB: 10. INSERT INTO phar_orders (status='DISPATCHED')
    PHAR->>ADAPT: 11. Dispatch Electronic Order (EDI / REST)
    ADAPT->>Pharmacy: 12. Submit Pharmacy Prescription Fill Request
    
    Pharmacy-->>ADAPT: 13. Webhook: Order Accepted & Out for Delivery
    ADAPT->>PHAR: 14. Ingest Status Update
    PHAR->>DB: 15. UPDATE phar_orders SET status='DELIVERED'
    PHAR->>REF: 16. Emit 'pharmacy.order_status_updated'
    REF->>DB: 17. Reset ref_inventories.remaining_quantity (+60 Tablets)
    REF-->>Caregiver: 18. Alert: 'Medication Delivered & Inventory Refreshed'
```

---

### 4.5 Family Member / Caregiver Delegated Access Flow

```mermaid
sequenceDiagram
    autonumber
    actor Caregiver as Family Caregiver
    participant SPA as React.js SPA
    participant GW as API Gateway (RBAC Middleware)
    participant PM as Patient Module
    participant DB as PostgreSQL Database
    participant AL as Audit Logger

    Caregiver->>SPA: 1. Switch Active Context to 'Elderly Mother' (patientId=X)
    SPA->>GW: 2. GET /api/v1/patients/X/medical-summary
    Note over GW: Extract Caregiver userId from JWT.<br/>Target resource is patient X.

    GW->>PM: 3. Verify Proxy Permission (caregiverId, patientId=X)
    PM->>DB: 4. SELECT * FROM pat_caregiver_links WHERE patient_id=X AND caregiver_user_id=Y
    
    alt Active Verified Consent Found
        DB-->>PM: 5. Record Found: access_level = 'FULL_DELEGATE'
        PM-->>GW: 6. Access Authorized
        GW->>DB: 7. Query Patient Demographics, Vitals & Med Schedules
        DB-->>GW: 8. Return Patient ePHI Dataset
        GW->>AL: 9. Log ePHI Access Event (Caregiver Y viewed Patient X records)
        GW-->>SPA: 10. 200 OK with Authorized Medical Summary
        SPA-->>Caregiver: 11. Render Mother's Health Dashboard
    else Consent Revoked or Not Found
        DB-->>PM: 12. No Active Link
        PM-->>GW: 13. Unauthorized Proxy Access
        GW->>AL: 14. Log Security Violation Attempt
        GW-->>SPA: 15. 403 Forbidden: Insufficient Caregiver Permissions
        SPA-->>Caregiver: 16. Display Access Request / Consent Pending Banner
    end
```

---

# 5. SECURITY ARCHITECTURE & HEALTHCARE COMPLIANCE

### 5.1 Healthcare Compliance Foundations (HIPAA & ePHI)
ElderGuardian AI processes Electronic Protected Health Information (ePHI). The system enforces technical safeguards compliant with the **HIPAA Security Rule (45 CFR Part 160 and Part 164)** and the **Minimum Necessary Standard**:
1. **Unique User Identification:** Shared family logins are strictly prohibited; each family caregiver, patient, and doctor maintains an isolated identity and audit trail.
2. **Emergency Access ("Break-Glass"):** Attending ER clinicians can request emergency access to a patient record, which immediately grants temporary 4-hour read-only access while triggering real-time alerts to the primary caregiver and generating a compliance audit report.
3. **Automatic Logoff & Inactivity Timeout:** Client sessions enforce inactivity termination after 15 minutes of idle state on patient and clinical portals.
4. **Tamper-Evident Audit Trails:** All database mutations on clinical tables write immutable records to an append-only audit log table, capturing `user_id`, `client_ip`, `action_type`, `before_state`, and `after_state`.

---

### 5.2 Authentication & Token Lifecycle

The authentication system implements a **Dual-Token Architecture with Token Family Rotation**:

```mermaid
flowchart TD
    LOGIN["User Submits Credentials\n(Email + Password / MFA)"] --> AUTH_VAL{"Validate Credentials\n& Active Status"}
    AUTH_VAL -->|Invalid| REJECT["401 Unauthorized\n(Increment Failed Attempt Counter)"]
    AUTH_VAL -->|Valid| ISSUE["Issue Token Pair"]
    
    subgraph TokenPair["Issued Tokens"]
        AT["Access Token (JWT)\n- Lifespan: 15 Minutes\n- Alg: RS256\n- Payload: userId, role, permissions\n- Stored: In-Memory / Client State"]
        RT["Refresh Token (Opaque UUID)\n- Lifespan: 7 Days\n- Stored: HttpOnly, Secure, SameSite=Strict Cookie\n- DB Record: SHA-256 Hashed with Family ID"]
    end
    
    ISSUE --> TokenPair
    
    subgraph RefreshCycle["Token Refresh Cycle"]
        REQ_REF["Client Requests /auth/refresh\nwith Cookie"] --> CHECK_DB{"Lookup Token in DB"}
        CHECK_DB -->|Token Reused / Compromised| REVOKE_ALL["Compromise Detected!\nRevoke Entire Token Family\nForce Re-Authentication"]
        CHECK_DB -->|Valid & Active| ROTATE["Rotate Token:\n- Invalidate Old Refresh Token\n- Issue New Access Token\n- Issue New Refresh Token (Same Family)"]
    end
```

---

### 5.3 Express API Gateway & Middleware Stack

Every HTTP request traverses an ordered, fail-safe middleware pipeline before reaching domain business logic:

```
[ Incoming Request ]
        |
        v
1. Request ID & Tracing Middleware (Injects UUIDv4 X-Correlation-ID header)
        |
        v
2. Security Headers via Helmet (Enforces CSP, HSTS, X-Content-Type-Options: nosniff, Frameguard: DENY)
        |
        v
3. CORS Policy Interceptor (Validates Origin against strict whitelist; rejects wildcard with credentials)
        |
        v
4. Tiered Rate Limiter (Redis / Memory token bucket; protects against brute force and scraping)
        |
        v
5. Request Body Sanitizer & Size Cap (Json body limit <= 2MB; multipart files <= 15MB)
        |
        v
6. JWT Verification & Session Resolver (Validates RS256 signature, expiry, and blacklisting)
        |
        v
7. RBAC & Caregiver Proxy Policy Guard (Verifies required role and patient consent delegation)
        |
        v
8. HIPAA Audit Logger Interceptor (Captures access context, user, IP, and target resource ID)
        |
        v
[ Target Domain Route Controller ]
        |
        v
9. Centralized Error Handler (Sanitizes stack traces; prevents ePHI leakage in error responses)
```

---

### 5.4 Data Encryption Strategy

```
+----------------------------------------------------------------------------------------------------+
|                                      DATA ENCRYPTION ARCHITECTURE                                  |
+----------------------+----------------------------+------------------------------------------------+
| Encryption State     | Standard / Algorithm       | Implementation Details                         |
+----------------------+----------------------------+------------------------------------------------+
| **Data in Transit**  | TLS 1.3 Mandatory          | Enforced via edge proxy. HSTS enabled with      |
|                      | (ECDHE-RSA-AES128-GCM-SHA256) `max-age=63072000; includeSubDomains; preload`   |
+----------------------+----------------------------+------------------------------------------------+
| **Data at Rest**     | AES-256-XTS Storage Volume | Cloud EBS / Managed PostgreSQL volumes         |
| (Database & Files)   | Encryption via AWS KMS     | encrypted with automated customer-managed keys.|
+----------------------+----------------------------+------------------------------------------------+
| **Field-Level ePHI** | Envelope Encryption        | Highly sensitive identifiers (National ID,     |
| (Column Encryption)  | (AES-256-GCM + PBKDF2)     | SSN, detailed clinical notes) encrypted before |
|                      |                            | write using application-level KMS keys.        |
+----------------------+----------------------------+------------------------------------------------+
| **File Storage**     | AWS S3 SSE-KMS / Local GPG | Prescription images encrypted immediately      |
|                      |                            | upon arrival. Access via pre-signed URLs only.  |
+----------------------+----------------------------+------------------------------------------------+
```

---

### 5.5 Rate Limiting & DoS Mitigation

Rate limiting is tiered according to endpoint criticality to prevent credential stuffing, resource exhaustion, and scraping:

| Endpoint Tier | Target Routes | Rate Limit Window | Maximum Allowed | Action on Breach |
| :--- | :--- | :--- | :--- | :--- |
| **Public Auth** | `/api/v1/auth/login`, `/register` | 15 Minutes | 5 requests per IP | HTTP 429 + Exponential backoff |
| **Standard API** | `/api/v1/patients/*`, `/meds/*` | 1 Minute | 120 requests per User | HTTP 429 Too Many Requests |
| **Compute Heavy** | `/api/v1/prescriptions/upload` | 1 Minute | 5 requests per User | HTTP 429 + Queue throttle |
| **Webhooks Ingress**| `/api/v1/webhooks/*` | 1 Minute | 300 requests per IP | HTTP 429 + Gateway Drop |

---

### 5.6 CORS & Browser Security Policy

```typescript
// Production CORS Configuration Specification
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.elderguardian.ai',
      'https://portal.elderguardian.ai',
      'https://admin.elderguardian.ai'
    ];
    // Disallow null origins, file:// or unauthorized domains
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Unauthorized origin'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'X-Correlation-ID',
    'X-Client-Version'
  ],
  exposedHeaders: ['X-Correlation-ID'],
  credentials: true, // Required for HttpOnly Refresh Cookie
  maxAge: 86400 // Cache preflight requests for 24 hours
};
```

---

# 6. DEPLOYMENT & OPERATIONAL ARCHITECTURE

### 6.1 Local Development Environment (Docker Compose)

The entire platform runs locally with a single command (`docker compose up --build`), mirroring production networking topology without external cloud dependencies.

```yaml
version: '3.8'

services:
  # -------------------------------------------------------------
  # Frontend: React.js SPA (Vite Dev Server / Nginx)
  # -------------------------------------------------------------
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: elderguardian-frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:5000/api/v1
    depends_on:
      - backend
    networks:
      - elderguardian-network

  # -------------------------------------------------------------
  # Backend: Node.js Modular Monolith (Express API)
  # -------------------------------------------------------------
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: elderguardian-backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
      - /app/node_modules
      - local_storage:/app/uploads
    environment:
      - NODE_ENV=development
      - PORT=5000
      - DATABASE_URL=postgres://elder_user:elder_pass@postgres:5432/elderguardian_db
      - ML_SERVICE_URL=http://ml-service:8000
      - JWT_SECRET=dev_jwt_secret_key_change_in_production_32chars
      - REFRESH_TOKEN_SECRET=dev_refresh_secret_key_change_in_prod
      - STORAGE_PROVIDER=LOCAL
      - STORAGE_LOCAL_PATH=/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      ml-service:
        condition: service_started
    networks:
      - elderguardian-network

  # -------------------------------------------------------------
  # ML Service: Python FastAPI Microservice
  # -------------------------------------------------------------
  ml-service:
    build:
      context: ./ml-service
      dockerfile: Dockerfile.dev
    container_name: elderguardian-ml
    ports:
      - "8000:8000"
    volumes:
      - ./ml-service:/app
    environment:
      - PYTHONUNBUFFERED=1
      - APP_ENV=development
      - HOST=0.0.0.0
      - PORT=8000
    networks:
      - elderguardian-network

  # -------------------------------------------------------------
  # Relational Database: PostgreSQL 15
  # -------------------------------------------------------------
  postgres:
    image: postgres:15-alpine
    container_name: elderguardian-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=elder_user
      - POSTGRES_PASSWORD=elder_pass
      - POSTGRES_DB=elderguardian_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U elder_user -d elderguardian_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - elderguardian-network

  # -------------------------------------------------------------
  # Local S3 Compatible Storage Mock (MinIO)
  # -------------------------------------------------------------
  minio:
    image: minio/minio:RELEASE.2023-09-07T02-05-02Z
    container_name: elderguardian-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - elderguardian-network

networks:
  elderguardian-network:
    driver: bridge

volumes:
  pgdata:
  local_storage:
  minio_data:
```

---

### 6.2 Production Deployment Progression

ElderGuardian AI follows a staged cloud infrastructure deployment strategy designed for low capital burn during pilot validation, scaling into a fault-tolerant multi-zone architecture.

```mermaid
flowchart TD
    subgraph Phase1["Phase 1: Seed / Pilot Launch (0 - 5,000 Patients)"]
        direction TB
        P1_EDGE["Single VPS / VM (Hetzner / DigitalOcean / AWS Lightsail)\n- Caddy (Automatic HTTPS / Let's Encrypt)\n- Docker Compose Orchestration"]
        P1_APP["Node.js Monolith + Python ML Containers"]
        P1_DATA["Managed PostgreSQL 15 (DBaaS) + AWS S3 Encrypted"]
        P1_EDGE --> P1_APP --> P1_DATA
    end

    subgraph Phase2["Phase 2: Scale & High Availability (5,000 - 150,000+ Patients)"]
        direction TB
        P2_CF["Cloudflare Enterprise (WAF, DDoS, Edge Caching)"]
        P2_ALB["AWS Application Load Balancer (Multi-AZ)"]
        
        subgraph P2_ECS["Auto-Scaling ECS Fargate / K8s Cluster"]
            NODE_PODS["Node.js API Tasks\n(Horizontal Pod Autoscaling on CPU/Mem)"]
            ML_PODS["Python ML Tasks\n(GPU-Optimized g4dn Instances / Queue-based Auto-Scale)"]
        end
        
        subgraph P2_STORAGE["Resilient Data Tier"]
            P2_RDS["AWS RDS Multi-AZ PostgreSQL 15\n(Primary + Read Replicas)"]
            P2_REDIS["AWS ElastiCache Redis 7 (Cluster Mode)"]
            P2_S3["AWS S3 Bucket + CloudFront CDN (Private Signed URLs)"]
        end
        
        P2_CF --> P2_ALB
        P2_ALB --> NODE_PODS
        NODE_PODS <--> ML_PODS
        NODE_PODS --> P2_RDS
        NODE_PODS --> P2_REDIS
        NODE_PODS --> P2_S3
    end

    Phase1 -.->|Painless Migration Path| Phase2
```

---

### 6.3 Configuration & Secrets Management

Configuration follows strict **12-Factor App principles**. Application startup executes strict runtime schema validation using **Zod** in Node.js and **Pydantic** in Python. If any environment variable is missing or malformed, the process immediately halts with an informative error code.

```typescript
// Backend Environment Schema Specification (src/config/env.ts)
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  ML_SERVICE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  STORAGE_PROVIDER: z.enum(['LOCAL', 'S3']),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  PHARMACY_ADAPTER_TYPE: z.enum(['MOCK', 'SURE_SCRIPTS']).default('MOCK'),
  SMS_ADAPTER_TYPE: z.enum(['MOCK', 'TWILIO']).default('MOCK'),
  EMAIL_ADAPTER_TYPE: z.enum(['MOCK', 'SENDGRID']).default('MOCK'),
});

export type EnvConfig = z.infer<typeof envSchema>;
```

---

# 7. INTEGRATION ARCHITECTURE

### 7.1 Adapter Pattern for External Services
To insulate the core healthcare domain from volatile 3rd-party vendor protocols, all external integrations use the **Adapter Design Pattern**. The application depends solely on abstract TypeScript interfaces; concrete implementations (Mock vs. Production) are bound at runtime via dependency injection based on configuration flags.

```mermaid
classDiagram
    class IPharmacyAdapter {
        <<interface>>
        +submitOrder(orderRequest: PharmacyOrderDTO): Promise~PharmacyOrderResult~
        +checkOrderStatus(externalOrderId: string): Promise~OrderStatusEnum~
        +cancelOrder(externalOrderId: string): Promise~boolean~
    }

    class MockPharmacyAdapter {
        -simulatedLatencyMs: number
        -failureRate: number
        +submitOrder(orderRequest): Promise~PharmacyOrderResult~
        +checkOrderStatus(externalOrderId): Promise~OrderStatusEnum~
    }

    class SureScriptsPharmacyAdapter {
        -apiKey: string
        -endpointUrl: string
        -signPayload(payload)
        +submitOrder(orderRequest): Promise~PharmacyOrderResult~
        +checkOrderStatus(externalOrderId): Promise~OrderStatusEnum~
    }

    class INotificationAdapter {
        <<interface>>
        +sendSms(to: string, message: string): Promise~NotificationResult~
        +sendEmail(to: string, subject: string, bodyHtml: string): Promise~NotificationResult~
    }

    class MockNotificationAdapter {
        +sendSms(to, message): Promise~NotificationResult~
        +sendEmail(to, subject, bodyHtml): Promise~NotificationResult~
    }

    class TwilioSendGridAdapter {
        -twilioClient
        -sendGridClient
        +sendSms(to, message): Promise~NotificationResult~
        +sendEmail(to, subject, bodyHtml): Promise~NotificationResult~
    }

    IPharmacyAdapter <|.. MockPharmacyAdapter : Implements for Dev/MVP
    IPharmacyAdapter <|.. SureScriptsPharmacyAdapter : Implements for Production
    INotificationAdapter <|.. MockNotificationAdapter : Implements for Dev/MVP
    INotificationAdapter <|.. TwilioSendGridAdapter : Implements for Production
```

---

### 7.2 Mock Adapter Suite for MVP
For rapid MVP testing and offline demonstration, ElderGuardian AI includes realistic mock adapters that emulate network delays, randomized delivery confirmations, and webhook triggers:

```typescript
// Concrete Implementation: MockPharmacyAdapter (src/integrations/pharmacy/MockPharmacyAdapter.ts)
import { IPharmacyAdapter, PharmacyOrderDTO, PharmacyOrderResult, OrderStatusEnum } from './IPharmacyAdapter';
import { logger } from '../../utils/logger';

export class MockPharmacyAdapter implements IPharmacyAdapter {
  async submitOrder(orderRequest: PharmacyOrderDTO): Promise<PharmacyOrderResult> {
    logger.info(`[MOCK PHARMACY] Processing order for Patient: ${orderRequest.patientId}`);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockExternalId = `MOCK-PHAR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    return {
      success: true,
      externalOrderId: mockExternalId,
      estimatedDeliveryDate: new Date(Date.now() + 48 * 3600 * 1000), // +48 hours
      status: OrderStatusEnum.DISPATCHED
    };
  }

  async checkOrderStatus(externalOrderId: string): Promise<OrderStatusEnum> {
    logger.info(`[MOCK PHARMACY] Polling status for order: ${externalOrderId}`);
    return OrderStatusEnum.PROCESSING;
  }

  async cancelOrder(externalOrderId: string): Promise<boolean> {
    logger.info(`[MOCK PHARMACY] Order cancelled: ${externalOrderId}`);
    return true;
  }
}
```

---

### 7.3 FHIR R4 Interoperability Compatibility Layer
To enable future interoperability with hospital electronic health records (Epic, Cerner, Allscripts), the domain model maps directly to **HL7 FHIR Release 4 (R4)** standard resources:

```
+----------------------------------------------------------------------------------------------------+
|                                  FHIR R4 RESOURCE MAPPING MATRIX                                   |
+--------------------------+-----------------------+-------------------------------------------------+
| ElderGuardian Entity     | Target FHIR Resource  | Canonical Mapping Description                   |
+--------------------------+-----------------------+-------------------------------------------------+
| `pat_profiles`           | `Patient`             | Demographics, identifier, telecom, contact.     |
| `pat_caregiver_links`    | `RelatedPerson`       | Relationship, patient reference, permissions.   |
| `hosp_doctors`           | `PractitionerRole`    | Specialty, organization reference, identifier.  |
| `app_appointments`       | `Appointment`         | Status, participant, start/end timestamps.      |
| `rx_prescriptions`       | `MedicationRequest`   | Medication reference, dosageInstruction, intent.|
| `med_active_medications` | `MedicationStatement` | Status, effectivePeriod, dosage details.        |
| `ref_requests`           | `SupplyRequest`       | Item reference, quantity, deliverTo, status.    |
| `hlt_vitals`             | `Observation`         | Category 'vital-signs', code (LOINC), value.    |
+--------------------------+-----------------------+-------------------------------------------------+
```

#### Example Bi-Directional Mapping (Vitals to FHIR `Observation`):
* Blood Pressure measurement (`systolic: 130`, `diastolic: 85`) translates to LOINC `85354-9` (Blood pressure panel), splitting into component codes `8480-6` (Systolic) and `8462-4` (Diastolic) with unit `mm[Hg]`.

---

### 7.4 Webhook Ingestion Engine
External partner pharmacies, automated laboratory devices, and carrier delivery services notify ElderGuardian AI via webhooks. The ingestion engine guarantees security, replay defense, and idempotency:

```mermaid
flowchart TD
    WH_REQ["Inbound Webhook HTTP POST\n/api/v1/webhooks/pharmacy\nHeaders: X-Signature, X-Timestamp"] --> SIG_CHECK{"Verify HMAC-SHA256\nSignature against\nShared Secret"}
    
    SIG_CHECK -->|Invalid Signature| DROP_401["401 Unauthorized\nLog Security Warning"]
    
    SIG_CHECK -->|Valid Signature| TIME_CHECK{"Check Timestamp Age\n(|Now - Timestamp| < 5 min)"}
    
    TIME_CHECK -->|Timestamp Expired| DROP_400["400 Bad Request\nReject Potential Replay Attack"]
    
    TIME_CHECK -->|Timestamp Fresh| IDEMP_CHECK{"Check Idempotency Key\nin sys_processed_webhooks"}
    
    IDEMP_CHECK -->|Already Processed| RET_200["200 OK (Idempotent Return)\nNo Duplicate Work"]
    
    IDEMP_CHECK -->|New Event| PERSIST_RAW["Store Raw Payload in DB\nINSERT sys_processed_webhooks"]
    
    PERSIST_RAW --> DISPATCH["Emit Domain Event\ne.g., 'pharmacy.order_status_updated'"]
    
    DISPATCH --> RET_SUCCESS["200 OK Accepted Response\n(Processed in < 150ms)"]
```

---

## Conclusion & Architecture Roadmap Summary

This document formalizes the production-ready architectural foundation for **ElderGuardian AI**. By pairing a high-velocity **Node.js/Express Modular Monolith** with an isolated **Python/FastAPI ML Microservice**, the system achieves:
- **Maximum Developer Velocity:** Rapid full-stack feature delivery without distributed systems friction.
- **Strict Clinical Integrity:** ACID transactional safety for appointments, prescriptions, and refills.
- **HIPAA-Compliant Security:** End-to-end encryption, strict RBAC, and immutable ePHI access audit trails.
- **Future-Proof Scalability:** Decoupled domain modules, adapter-isolated external dependencies, and FHIR R4 alignment enabling frictionless long-term cloud scaling.
