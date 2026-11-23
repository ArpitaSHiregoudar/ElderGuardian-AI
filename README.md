# ElderGuardian AI — Hospital-Connected Healthcare Coordination Platform

ElderGuardian AI is a hospital-connected, AI-powered healthcare coordination platform designed for elderly individuals (60+), chronic-care patients, and remote family caregivers.

It orchestrates the complete **Care Journey Engine**:
$$\text{Doctor Consultation} \longrightarrow \text{Digital Rx Ingestion} \longrightarrow \text{Medication Adherence} \longrightarrow \text{Depletion Detection} \longrightarrow \text{Prescription Verification \& Refill} \longrightarrow \text{Doorstep Delivery} \longrightarrow \text{Diagnostics} \longrightarrow \text{Follow-Up}$$

---

## 🏛️ Comprehensive Architecture & Specification Documentation

All architectural specifications, regulatory checklists, database schemas, and roadmaps are located in this workspace:

| Document | File Link | Description |
| :--- | :--- | :--- |
| **Product Requirements Document (PRD)** | [ELDERGUARDIAN_AI_PRD.md](file:///D:/Projec/ELDERGUARDIAN_AI_PRD.md) | Full 13-module requirements, geriatric clinical context, personas & safety boundaries |
| **System Architecture** | [ELDERGUARDIAN_SYSTEM_ARCHITECTURE.md](file:///D:/Projec/ELDERGUARDIAN_SYSTEM_ARCHITECTURE.md) | Modular monolith architecture, event bus, sequence diagrams & topologies |
| **Database Schema & ER Diagram** | [DATABASE_SCHEMA.md](file:///D:/Projec/DATABASE_SCHEMA.md) | 26 entities, Mermaid ER diagram, Knex.js dual-dialect (SQLite/PostgreSQL) specs |
| **REST API Specification** | [ELDERGUARDIAN_API_SPECIFICATION.md](file:///D:/Projec/ELDERGUARDIAN_API_SPECIFICATION.md) | Complete endpoints, request/response envelopes, JWT claims & cursor pagination |
| **UI/UX Design Specification** | [ELDERGUARDIAN_UI_UX_DESIGN_SPEC.md](file:///D:/Projec/ELDERGUARDIAN_UI_UX_DESIGN_SPEC.md) | WCAG 2.1 AA/AAA compliance, 18px+ typography, senior-friendly color palette |
| **AI/ML Implementation Strategy** | [AI_ML_IMPLEMENTATION_STRATEGY.md](file:///D:/Projec/AI_ML_IMPLEMENTATION_STRATEGY.md) | Prescription OCR pipeline, adherence & depletion modeling, synthetic data strategy |
| **Security, Privacy & Compliance** | [ELDERGUARDIAN_SECURITY_PRIVACY_COMPLIANCE.md](file:///D:/Projec/ELDERGUARDIAN_SECURITY_PRIVACY_COMPLIANCE.md) | DPDP Act 2023, ABDM/ABHA integration, audit logging & encryption |
| **Business Model & Market Validation** | [ELDERGUARDIAN_BUSINESS_MODEL_MARKET_VALIDATION.md](file:///D:/Projec/ELDERGUARDIAN_BUSINESS_MODEL_MARKET_VALIDATION.md) | B2B2C hospital subscription tiers, unit economics & pilot validation plan |
| **Engineering Roadmap** | [ROADMAP.md](file:///D:/Projec/ROADMAP.md) | 10-week MVP sprint schedule, resource allocation & definition of done |

---

## 💻 Tech Stack

- **Frontend:** React.js, Tailwind CSS, Lucide Icons, Vite
- **Backend:** Node.js, Express.js, Knex.js ORM
- **Database:** SQLite (Local Dev with WAL mode) / PostgreSQL (Production)
- **Design:** Senior-friendly ergonomics (WCAG 2.1 AAA high-contrast, large touch targets)

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js 18+ & npm** (Install via [nodejs.org](https://nodejs.org/) or `winget install OpenJS.NodeJS.LTS`)

### 1. Run the Frontend (React.js)
```bash
cd apps/web
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

You can interactively switch between 3 perspectives:
1. **Senior Patient View (Ramesh Kumar, 72):**
   - High-contrast medicine schedule with large 1-tap **"TAKE DOSE"** action buttons
   - Next hospital appointment countdown (Dr. Suresh Sharma, Apollo Chennai)
   - Real-time stock depletion alert (4 days remaining for Telmisartan)
   - 24/7 Red SOS Emergency Escalation trigger
2. **Family Caregiver View (Priya Sharma - Remote Guardian):**
   - Longitudinal medication adherence percentage ring
   - Morning blood pressure tracking with safe-range verification
   - 1-tap proxy refill approval for partner pharmacy delivery
   - Direct parent call launcher
3. **Doctor OPD View (Dr. Suresh Sharma, MD):**
   - Clinical daily queue with ABHA & chronic history summary
   - Interactive **"Write Digital Prescription"** modal that immediately generates patient dosage schedules

### 2. Run the Backend API (Node.js/Express)
```bash
cd apps/api
npm install
npm run migrate
npm run seed
npm run dev
```
API runs on **[http://localhost:5000/api/v1](http://localhost:5000/api/v1)**.
Health check: `http://localhost:5000/api/v1/health`
