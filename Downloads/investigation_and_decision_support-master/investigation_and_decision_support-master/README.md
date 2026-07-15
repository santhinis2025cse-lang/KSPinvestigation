# KSP Crime Intelligence Platform
### AI-Powered Investigation & Decision Support System (Karnataka State Police Datathon 2026)

The **KSP Crime Intelligence Platform** is a premium, state-of-the-art Command Center intelligence system designed for the Karnataka State Police. It translates raw, scattered crime records into actionable intelligence—helping officers search, analyze, visualize, predict, and manage crime cases using Machine Learning and Social Network Analysis (SNA).

---

## Key Features

1.  **Command Center Dashboard**: Power BI-inspired analytics with Monthly Crime Trends (Area charts), Category breakdowns (Bar charts), District incident metrics, and Urgent alerts.
2.  **AI Investigation Copilot**: Sleek Chat-assistant that compiles automated FIR summaries, lists repeat offenders, suggests investigation leads, and outputs Explainable AI (XAI) weighting factors.
3.  **Advanced Crime Search & Command Palette**: Raycast-style global search (`Ctrl + K` or `Cmd + K`) for instant navigation, suspect lookups, and natural language filters.
4.  **GIS Hotspots Map**: Dark CartoDB GIS map showing density hotspot cluster zones, incident markers, and a time-slider playback control.
5.  **Association Network Graph**: Interactive canvas (React Flow) rendering criminal associate networks (OWNS, SPOTTED_NEAR, GANG_MEMBER) with click inspection.
6.  **Investigation Workspace**: Notes canvas with autosave alerts, side-by-side case comparisons, and connected evidence grids.
7.  **Role-Based Access Control (RBAC)**: Distinct permissions for Officers, Investigators, Inspectors, Analysts, and SCRB/System Admins.
8.  **Audit Logs Compliance**: Secured ledger logging searches, downloads, login times, and exports for transparent judicial verification.

---

## Technology Stack

*   **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, Leaflet GIS, React Flow, CMDK.
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT, PostgreSQL, Winston Logger.
*   **AI Service**: Python 3.10, FastAPI, Scikit-Learn (DBSCAN Clustering), NetworkX (Social Network Graph calculations), Pandas, NumPy.
*   **Containers**: Docker, Docker Compose.

---

## Monorepo Architecture

```
/ksp-crime-intelligence
  ├── /frontend            # Next.js Client Web App
  ├── /backend             # Express.js Core API Server & Prisma Schema
  ├── /ai-service          # FastAPI Python AI Analytics Engine
  ├── docker-compose.yml   # Multi-container local orchestration configuration
  └── README.md            # Operations Guide
```

---

## Getting Started

To ensure maximum presentation stability, the platform supports two operational modes out-of-the-box (toggleable in **Settings**):
*   **Demo Mode (Simulated)**: Runs 100% locally with high-fidelity pre-compiled KSP datasets. Ideal for offline judges presentation with zero setups.
*   **Production Mode**: Connects dynamically to the PostgreSQL database, Node.js API, and Python AI Service.

### Option A: One-Command Docker Deployment (Production Mode)

Ensure you have Docker and Docker Compose installed, then execute:

```bash
docker-compose up --build
```

This commands builds and launches:
*   **Database**: PostgreSQL listening on `5432`
*   **Core API**: Express server listening on `5000` (auto-seeds database on start!)
*   **AI Engine**: FastAPI Python service listening on `8000`
*   **Web Client**: Next.js client listening on `3000`

Open [http://localhost:3000](http://localhost:3000) inside your web browser.

---

### Option B: Local Development Setup

#### 1. PostgreSQL Database & Express Backend
Navigate to the backend directory, install packages, and start the development server:

```bash
cd backend
npm install
# Configure your connection string in .env
npx prisma db push
npm run dev
```

#### 2. FastAPI Python AI Engine
Navigate to the AI service directory, initialize virtual environment, and launch:

```bash
cd ai-service
pip install -r requirements.txt
python app/main.py
```

#### 3. Next.js Frontend App
Navigate to the frontend directory, install packages, and boot:

```bash
cd frontend
npm install
npm run dev
```

---

## Test Suites Execution

*   **Backend API Units**: Run `npm run test` inside the `/backend` folder.
*   **AI Service Pytests**: Run `pytest` inside the `/ai-service` folder.
*   **Frontend E2E**: Run `npx playwright test` inside the `/frontend` folder.
