
# Rekama Systems

![Rekama Badge](https://img.shields.io/badge/Status-Production%20Ready-green?style=for-the-badge)
![Gemini Badge](https://img.shields.io/badge/Powered%20By-Google%20Gemini-purple?style=for-the-badge)
![PostgreSQL Badge](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql&style=for-the-badge)
![Compliance Badge](https://img.shields.io/badge/Compliance-ISO%2015489%20%7C%20ISO%2027001-blue?style=for-the-badge)

**Rekama Systems** is a next-generation Information Governance platform powered by Artificial Intelligence. It serves as a "Digital Sentinel" for enterprise data, offering In-Place Management, Risk Analysis, and Regulatory Compliance.

---

## 🔐 Role-Based Access Control (RBAC)

Rekama implements a rigorous RBAC model to ensure **Separation of Duties** and satisfy **ISO 27001 (Control A.5.15)** requirements. Access to governance actions is strictly gated by persona.

### 👤 Governance Personas

| Persona | Primary Function | Business Context |
| :--- | :--- | :--- |
| **System Administrator** | Infrastructure & Connectivity | IT staff managing system health, integrations, and user identities. |
| **Compliance Manager** | Authority & Lifecycle | Senior governance officers with "Master" authority, including destruction. |
| **Records Officer** | Operational Management | Daily handlers responsible for indexing and metadata accuracy. |
| **Legal Analyst** | Discovery & Litigation | Legal teams managing discovery requests and placing legal holds. |
| **Internal Auditor** | Verification & Reporting | Read-only access to immutable audit trails for compliance verification. |

---

## 🛡️ Advanced Governance Features

### 📊 Data Sentinel (Governance Dashboard)
The **Data Sentinel** serves as the primary command center, providing high-level observability into the organization's information assets.
- **Real-Time KPI Tracking**: Monitors total record volume, identifies high-risk items requiring immediate review, and tracks global compliance scores.
- **Risk Distribution Mapping**: Visualizes data classification spreads (Public vs. Restricted) using Recharts.
- **Compliance Scoring Engine**: Calculates an aggregate governance health score based on ISO 15489 principles.

### 🗄️ Records Registry (Lifecycle Management)
The core engine for defensible records management and legal defensibility.
- **ISO 16175 Integrity**: Every record is indexed with a SHA-256 checksum and versioning to ensure evidentiary weight.
- **Legal Hold Orchestration**: Securely "locks" records involved in litigation, preventing accidental destruction.
- **Defensible Destruction**: Workflow for authorized approval and generation of a permanent **Certificate of Destruction**.

### ⚖️ Policies & Rules (Governance Frameworks)
The platform's regulatory brain, where organizational rules are codified and enforced.
- **AI Policy Drafter**: Utilizes Gemini 3 Pro to generate enterprise-grade security and governance policies.
- **Policy Comparator (Gap Analysis)**: AI-driven side-by-side comparison of policies to identify conflicts and regulatory non-conformities.
- **Retention Schedules**: Mapping of business functions to legal retention periods.

### 🔗 Data Connectors (In-Place Discovery)
Rekama avoids the "Data Swamp" problem by governing data where it resides.
- **Zero-Copy Indexing**: Connectors for SharePoint, OneDrive, AWS S3, and Slack map metadata without moving payloads.
- **Local Node Mapping**: Crawls local directories and registers them as managed governance nodes using the File System Access API.

### 🧠 Knowledge Base (Semantic RAG)
A Retrieval-Augmented Generation (RAG) system that transforms the record registry into an interactive intelligence hub.
- **Semantic Discovery**: Uses `text-embedding-004` to perform high-dimensional vector searches.
- **Dual-Mode Intelligence**: Fast Mode (Flash) for rapid queries and Thinking Mode (Pro) for complex reasoning.

### 🛡️ Risk Analyzer (Deep Content Inspection)
An ad-hoc forensic tool for inspecting unstructured text and documents.
- **PII Detection**: Automatically flags Names, Emails, SSNs, and other sensitive entities.
- **ISO 27002 Mapping**: Findings are mapped directly to international security controls.

### 🔒 Security & Audit (Immutable Forensic Trail)
The platform's core accountability layer, designed for legal defensibility and forensic transparency.
- **Immutable Audit Trail**: Every user interaction, data mutation, and security event is recorded in a write-once PostgreSQL log.
- **AI Anomaly Detection (Sentinel)**: Gemini-powered scanning of the audit trail to detect "low and slow" data exfiltration, mass exports, and unauthorized privilege escalations.
- **Metadata Inspection**: Deep-dive access to the JSON metadata payload of every system event for forensic investigation.
- **Threat Velocity Monitoring**: Real-time visualization of security incidents by severity (Critical, High, Medium, Low).

### ⚙️ Settings (Infrastructure & Team Management)
The configuration hub for aligning the platform with organizational and regulatory requirements.
- **User & Team Management**: Granular RBAC control allowing System Administrators to manage identities, roles, and security clearances.
- **Automated SoA Reporting**: AI synthesis of system telemetry to generate a professional **Statement of Applicability** for ISO 27001 / ISO 15489 audits.
- **Verifiable Archive Export**: Generation of a cryptographically signed (SHA-256) JSON bundle of all platform data for long-term off-system archival.
- **Notification Control**: Configuration of system-wide alerts for disposal due dates, risk detections, and synchronization errors.
- **Infrastructure Connectivity**: Direct management of the PostgreSQL (Supabase) and Gemini AI sentinel handshakes.

---

## 🛠 Database Setup (PostgreSQL via Supabase)

Rekama Systems has been migrated from local SQLite to a high-performance **PostgreSQL** backend. Follow these steps to initialize your governance environment:

### 1. Create your Supabase Project
1.  Go to [supabase.com](https://supabase.com) and create a new project.
2.  Note your **Project URL** and **Anon Key** from the `Settings > API` section.

### 2. Environment Configuration
Add the following variables to your `.env` file or deployment environment:
```properties
API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key
```

### 3. Initialize Database Schema
Run the following SQL in your Supabase SQL Editor to create the necessary tables and seed the initial administrator:

```sql
-- Create Tables
CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    title TEXT,
    type TEXT,
    classification TEXT,
    status TEXT,
    "riskScore" INTEGER,
    source TEXT,
    "uploadedAt" TIMESTAMPTZ,
    "legalHold" BOOLEAN DEFAULT FALSE,
    "retentionScheduleId" TEXT,
    "disposalDate" TIMESTAMPTZ,
    checksum TEXT,
    version INTEGER,
    custodian TEXT,
    format TEXT
);

CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    content TEXT,
    "createdAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT,
    description TEXT,
    "retentionYears" INTEGER,
    trigger TEXT
);

CREATE TABLE IF NOT EXISTS connectors (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    status TEXT,
    "itemsIndexed" INTEGER,
    "lastSync" TIMESTAMPTZ,
    "targetUrl" TEXT
);

CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ,
    "user" TEXT,
    action TEXT,
    resource TEXT,
    severity TEXT,
    metadata TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT,
    avatar TEXT,
    "lastLogin" TIMESTAMPTZ,
    password TEXT
);

CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Seed Initial Admin User
INSERT INTO users (id, name, email, role, avatar, password)
VALUES ('usr_sysadmin', 'IT Administrator', 'admin@rekama.sys', 'System Administrator', 'IT', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Schedules
INSERT INTO schedules (id, code, name, description, "retentionYears", trigger)
VALUES 
    ('sch_1', 'FIN-001', 'Financial Records', 'Invoices, Tax, Ledger', 7, 'Creation'),
    ('sch_2', 'HR-005', 'Employee Contracts', 'Full time employment contracts', 7, 'Event'),
    ('sch_3', 'EXE-999', 'Executive Correspondence', 'Board minutes and decisions', 25, 'Creation')
ON CONFLICT (id) DO NOTHING;
```

---

## 🔄 Operational Workflow

Rekama Systems follows a strict **"In-Place Governance"** philosophy. Unlike traditional systems that require data migration, Rekama indexes and governs data where it currently resides.

1.  **Identity & Secure Access (ISO 27001)**: Persona-Based Entry with RBAC and session protection.
2.  **Data Connection**: Zero-copy indexing of SharePoint, S3, and OneDrive via Connectors.
3.  **Intelligence**: Gemini-powered risk analysis, PII detection, and ISO 27002 mapping.
4.  **Lifecycle**: Sentencing via Retention Schedules and Legal Hold management in the Records Registry.
5.  **Audit**: Every action is recorded in the Immutable Audit Trail in PostgreSQL.

---

## 🚀 Key Features

*   **Data Sentinel Dashboard**: Real-time analytics with Recharts.
*   **Knowledge Base (RAG)**: Semantic discovery using Gemini 3 models.
*   **Security Audit**: Forensic logging and AI anomaly detection.
*   **AI Policy Drafter**: Automated generation of enterprise security policies.

---

## 🛠 Technology Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons.
*   **Database**: PostgreSQL (via Supabase).
*   **AI**: Google Gemini API (@google/genai).
*   **Analytics**: Recharts.

---

## 📄 License
MIT License.
