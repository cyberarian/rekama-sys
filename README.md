# Rekama Systems

![Rekama Badge](https://img.shields.io/badge/Status-Beta-blue?style=for-the-badge)
![Gemini Badge](https://img.shields.io/badge/Powered%20By-Google%20Gemini-purple?style=for-the-badge)
![Compliance Badge](https://img.shields.io/badge/Compliance-ISO%2015489%20%7C%20ISO%2027001-green?style=for-the-badge)

**Rekama Systems** is a next-generation Information Governance platform powered by Artificial Intelligence. It serves as a "Digital Sentinel" for enterprise data, offering In-Place Management, Risk Analysis, and Regulatory Compliance without moving your data to proprietary storage.

The platform is architected to align with **ISO 15489** (Records Management), **ISO 16175** (Digital Records Integrity), and **ISO/IEC 27002:2022** (Information Security Controls).

---

## 🚀 Features

### 1. Data Sentinel Dashboard
*   Real-time visualization of data risk across the enterprise.
*   Classification distribution (Public vs. Restricted).
*   Source connectivity status.

### 2. Intelligent Discovery & Connectors
*   **In-Place Management**: Connect to SharePoint, OneDrive, S3, and Slack without migrating data.
*   **Crawl & Index**: Simulates indexing of remote content for metadata governance.
*   **Lifecycle Control**: Pause/Resume syncing and manage connector configurations.

### 3. Knowledge Base (RAG)
*   **Vector Search**: Uses `text-embedding-004` to semantically search uploaded documents.
*   **Dual-Mode Chat**:
    *   **Fast Mode**: Uses `gemini-2.5-flash` for high-speed retrieval.
    *   **Thinking Mode**: Uses `gemini-3-pro-preview` with extended thinking budgets for complex reasoning chains.
*   **Knowledge Graph**: Interactive visualization of policy and record relationships.

### 4. Risk Analyzer (ISO 27002 Aligned)
*   **Ad-Hoc Scanning**: Paste text or drag files to detect PII and compliance violations.
*   **Control Mapping**: Automatically maps detected risks to specific **ISO/IEC 27002:2022** controls (e.g., *5.12 Classification of information*).
*   **Automated Scoring**: AI assigns a risk score (0-100) and classification.

### 5. Records Registry (ISO 15489 & 16175)
*   **Digital Integrity**: Every record includes a **SHA-256 Checksum** and version history to ensure immutability (ISO 16175).
*   **Secure Disposition**: Deletion is handled via a formal process that generates a **Certificate of Destruction** in the audit log (ISO 15489).
*   **Retention Schedules**: Map "Sentences" (Authorities) to records to calculate disposal dates automatically.
*   **Legal Hold**: Immutable locking of records for eDiscovery purposes.

### 6. Policies & Rules
*   **AI Policy Drafter**: Describe a policy in plain English, and Gemini generates the JSON structure.
*   **Policy Comparator**: Side-by-side AI analysis of two policies to find conflicts or gaps.

### 7. Security & Audit (ISO 30301)
*   **Compliance Dashboard**: Real-time view of system alignment with ISO standards.
*   **RBAC**: Granular roles (Admin, Officer, Viewer).
*   **Forensic Logs**: Immutable database of every system action.
*   **Anomaly Detection**: AI agent analyzes logs to detect threats (e.g., "Mass Export detected at 3 AM").

---

## 🛠 Tech Stack

*   **Frontend**: React 18, TypeScript, Vite.
*   **Styling**: Tailwind CSS (Enterprise Slate Theme).
*   **AI/LLM**: Google GenAI SDK (Gemini 2.5 Flash, Gemini 3 Pro, Text-Embedding-004).
*   **Database**: `sql.js` (SQLite WASM) + IndexedDB for robust client-side persistence.
*   **Visualization**: Recharts, Custom SVG graphs.
*   **Icons**: Lucide React.

---

## 📦 Installation

### Prerequisites
*   Node.js v18+
*   Google AI Studio API Key

### Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/cyberarian/rekama-sys.git
    cd rekama-sys
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_gemini_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 📖 Usage Guide

### First Time Login
The system auto-seeds with a default **Admin** user.
*   **User**: John Admin
*   **Role**: Administrator

### Adding Data Sources
1.  Navigate to **Data Connectors**.
2.  Click **Add Connector**.
3.  Select a type (e.g., SharePoint) and name it.
4.  The system will simulate the "Handshake" and "Initial Crawl" phases.

### Drafting a Policy
1.  Go to **Policies & Rules** -> **AI Drafter**.
2.  Type: *"Create a retention policy for HR employee contracts that lasts 7 years."*
3.  Click **Generate**. The AI will structure the policy for you to save.

### Secure Disposition (Destruction)
1.  Navigate to **Records Registry**.
2.  Identify a record ready for disposal.
3.  Click the **Trash** icon.
4.  Confirm the secure destruction.
5.  Check **Security & Audit** logs to view the generated **Certificate of Destruction**.

---

## 🛡️ Security Note
This application uses a **Client-Side Database** (SQLite via WASM). In a real production environment, the `dbService` would be replaced by a REST/GraphQL API connecting to a secure backend (PostgreSQL/SQL Server). The API Key should never be exposed in client-side code in production; use a proxy server.

---

## 📄 License
MIT License.
