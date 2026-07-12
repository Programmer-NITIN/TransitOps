# 🌐 TransitOps: Next-Generation Fleet & Logistics Command Center

[![Live Demo](https://img.shields.io/badge/Demo-Live_Deployment-00C7B7?style=for-the-badge&logo=vercel)](https://transitops.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React_18%20%7C%20Node.js%20%7C%20PostgreSQL-2b3137?style=for-the-badge&logo=github)](#-technical-architecture)
[![Design](https://img.shields.io/badge/UI_UX-Glassmorphism_Design_System-purple?style=for-the-badge)](#-signature-design-system--ui-ux)
[![Database](https://img.shields.io/badge/Database-Neon_Serverless_Postgres-00e599?style=for-the-badge&logo=postgresql)](#-database-schema--entity-relationships)

> **Empowering modern transport hubs with real-time telematics, atomic transactional safeguards, and high-density operational intelligence.**

---

## 🏆 Why TransitOps? (Hackathon Highlights)

TransitOps was engineered from the ground up to solve complex logistics challenges through **strict data integrity** and **intuitive, high-density visualization**. It isn't just a basic CRUD app; it's a hardened operational engine.

1.  **Bulletproof Transactional Integrity**: We implemented atomic `BEGIN/COMMIT` SQL transaction blocks in our backend services. When a trip is dispatched, or maintenance is logged, multiple tables update simultaneously. If any validation fails (e.g., a driver is double-booked or a vehicle is in the shop), the *entire transaction rolls back*, ensuring zero data corruption or ghost states.
2.  **Real-Time ROI & Expense Telemetry**: The platform calculates vehicle-specific return on investment on the fly. It aggregates fuel consumption, toll fees, and maintenance costs against trip revenue—rendered via Chart.js into actionable insights.
3.  **Bespoke "Command Center" UI**: We rejected generic UI templates to build a custom, dark-themed Glassmorphism interface. It features real-time KPI glows, micro-animations, skeleton loading states, and a semantic color system that instantly communicates operational urgency to fleet managers.
4.  **Role-Based Access Control (RBAC)**: Deeply integrated security where JWT claims dictate both backend API endpoint access and conditional frontend UI rendering across four distinct organizational roles.
5.  **Type-Safe Database Engineering**: Leveraging native PostgreSQL `ENUM` types for status fields and stringent `CHECK` constraints (e.g., preventing negative cargo weights or odometer rollbacks at the database level).

---

## 🏗️ Technical Architecture

TransitOps employs a robust, scalable N-tier architecture designed for high availability, rapid iteration, and secure data flow.

```mermaid
graph TD
    subgraph "Frontend: Vercel (React + Vite)"
        UI[Glassmorphic UI] --> AuthContext[Context API: Auth & State]
        AuthContext --> APIClient[Axios/Fetch Wrapper]
        UI --> Charts[Chart.js / Analytics]
    end
    
    subgraph "Backend: Render (Node.js + Express)"
        APIClient -- "REST over HTTPS + JWT" --> Gateway[Express Router]
        Gateway --> AuthMW[Authorize Middleware]
        AuthMW --> Controllers[Module Controllers]
        Controllers --> Services[Business Logic & Transactions]
    end

    subgraph "Database Layer: Neon Cloud (PostgreSQL)"
        Services -- "pg-pool connection" --> DB[(Neon Serverless DB)]
        DB --> Triggers[Audit Triggers]
        DB --> Indexes[B-Tree Indexes]
    end

    style UI fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Gateway fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#fff
    style DB fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fff
```

### Stack Breakdown
*   **Client**: React 18, Vite for lightning-fast HMR, React Router DOM for routing, Chart.js for data visualization, Vanilla CSS tailored with a custom design system.
*   **Server**: Node.js, Express.js, `pg` (node-postgres) for connection pooling, JWT for stateless authentication, bcrypt for secure credential hashing.
*   **Infrastructure**: Hosted on Vercel (Frontend) and Render (Backend API), backed by a fully managed Neon PostgreSQL instance.

---

## 🔒 Enterprise-Grade RBAC (Role-Based Access Control)

Security isn't an afterthought. TransitOps utilizes secure JWT payloads to enforce strict access rules at both the API boundary and the React component tree level.

| Operational Area | 👑 Fleet Manager | 🚚 Driver | 🛡️ Safety Officer | 📈 Financial Analyst |
| :--- | :---: | :---: | :---: | :---: |
| **Global Dashboard** | ✅ Full Access | ⚠️ Restricted | ⚠️ Safety Metrics | ⚠️ Financial Metrics |
| **Fleet Inventory** | ✅ Create/Edit | 🚫 No Access | 👁️ View Only | 👁️ View Only |
| **Driver Roster** | ✅ Create/Edit | 🚫 No Access | ✅ Create/Edit | 🚫 No Access |
| **Trip Dispatching** | ✅ Full Control | 👁️ View Own Trips| ✅ Full Control | 🚫 No Access |
| **Maintenance Logs** | ✅ Create/Edit | 🚫 No Access | 👁️ View Only | 👁️ View Only |
| **Fuel & Expenses** | ✅ Full Control | ✅ Log Fuel Only | 🚫 No Access | ✅ Full Control |
| **Advanced Analytics** | ✅ Full Access | 🚫 No Access | 🚫 No Access | ✅ Full Access |

---

## 🛡️ Hardened Transactional Business Rules

The true power of TransitOps lies in its backend service layer. We enforce real-world logistics rules using **atomic SQL transactions** (`BEGIN`, `COMMIT`, `ROLLBACK`) to guarantee absolute data consistency under concurrent load.

### 1. The Capacity & Qualification Safeguard
*   **Rule**: A dispatch request is immediately rejected if the `cargo_weight_kg` exceeds the assigned vehicle's `max_load_capacity_kg`, OR if the driver's license is expired.
*   **Execution**: The transaction validates these constraints server-side before locking the vehicle and driver resources.

### 2. Double-Booking Prevention
*   **Rule**: A driver or vehicle cannot be assigned to a new trip if their current status is `On Trip`, `In Shop`, or `Suspended`.
*   **Execution**: `SELECT ... FOR UPDATE` style logic checks current states; if invalid, the transaction rolls back immediately with a precise error payload sent to the client.

### 3. Automated State Recovery (Triggers & Logic)
*   **Rule**: When a trip is marked `Completed` or `Cancelled`, the associated vehicle and driver must immediately return to `Available` status.
*   **Execution**: Multi-table `UPDATE` statements are bundled in the exact same transaction block as the trip status update.

---

## 🗄️ Database Schema & Entity Relationships

The schema is heavily optimized for analytical read-heavy workloads while maintaining strict relational integrity.

```mermaid
erDiagram
    VEHICLES ||--o{ TRIPS : "assigned to"
    VEHICLES ||--o{ MAINTENANCE_LOGS : "undergoes"
    VEHICLES ||--o{ FUEL_LOGS : "consumes"
    VEHICLES ||--o{ EXPENSES : "incurs"
    
    DRIVERS ||--o{ TRIPS : "drives"
    DRIVERS ||--o{ FUEL_LOGS : "logs (optional)"
    
    TRIPS ||--o{ FUEL_LOGS : "generates (optional)"
    TRIPS ||--o{ EXPENSES : "generates (optional)"
    
    ROLES ||--o{ USERS : "defines permissions for"

    VEHICLES {
        uuid id PK
        varchar registration_number UK
        vehicle_status status "ENUM"
        decimal max_load_capacity_kg
    }
    
    TRIPS {
        uuid id PK
        uuid vehicle_id FK
        uuid driver_id FK
        trip_status status "ENUM"
        decimal revenue
    }
```

### Database Optimizations
*   **Custom Types**: Deep utilization of Enums for `vehicle_status`, `driver_status`, `trip_status`, and `maintenance_status` prevents string-based typo errors at the DB level.
*   **B-Tree Indexes**: Strategically placed on high-frequency query columns (`status`, `vehicle_id`, `driver_id`, `created_at`) to ensure sub-millisecond lookups for dashboard analytics.
*   **Audit Triggers**: A custom PL/pgSQL function automatically updates `updated_at` timestamps on any row modifications.

---

## 🎨 Signature Design System & UI UX

The platform features a proprietary **Glassmorphic Command Center** design language, emphasizing clarity, focus, and modern aesthetics.

*   **Dark-Themed Surface Scale**: Material-3 inspired elevations (lowest `#0b0e15` to high `#272a31`) create deep visual hierarchy without overwhelming the user.
*   **Semantic Typography**: 
    *   `Geist` for striking, high-impact numerical KPIs and page titles.
    *   `JetBrains Mono` for tabular data, currency, and IDs to ensure perfect vertical alignment.
    *   `Inter` for highly readable body text.
*   **Component Polish**: Custom toast notification systems, shimmering skeleton loaders for async data, and contextual glowing icons that react to system state (e.g., green pulse for `Available`, amber for `In Shop`).

---

## 🚀 Local Installation & Setup

Want to run the command center on your own machine? Follow these steps.

### Prerequisites
*   Node.js (v18+)
*   PostgreSQL (Local or Cloud instance like Neon)

### 1. Database Initialization
```bash
# Connect to your postgres instance and run the schema definition
psql -U your_user -d your_db -f backend/db/schema.sql

# (Optional) Seed the database with realistic sample data
psql -U your_user -d your_db -f backend/db/seed.sql
```

### 2. Backend Configuration
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/transitops?sslmode=disable
JWT_SECRET=super_secret_hackathon_key_2026
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
```
Start the server:
```bash
npm run dev
# The API will be available at http://localhost:5000/api
```

### 3. Frontend Configuration
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
```
Start the client:
```bash
npm run dev
# The UI will be available at http://localhost:5173
```

---

## 📊 Exporting & Reporting
TransitOps includes seamless client-side CSV generation. Any tabular view (Fleet, Trips, Maintenance, Expenses) can be instantly exported for external auditing via our unified `exportToCsv` utility module, which parses the current JSON state into correctly encoded CSV streams.

---

## 📝 Hackathon Final Checklist
- [x] **Zero Build Artifacts in Repo**: Clean `.gitignore` implementation.
- [x] **Secure Secrets Management**: `.env` files completely isolated from source control.
- [x] **Robust Error Handling**: Global Express error middleware intercepts all unhandled promises and DB constraint violations, returning sanitized JSON.
- [x] **CORS Hardening**: Multi-origin CORS configuration dynamically supporting local dev environments and Vercel preview URLs.

---

> Built with precision for the Hackathon. 
> *TransitOps — Moving logistics forward.*
