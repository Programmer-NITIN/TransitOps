# TransitOps — Smart Fleet & Logistics Command Center

[![Production Deployment](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)](https://transitops.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Postgres-blue?style=for-the-badge)](#tech-stack)
[![Design System](https://img.shields.io/badge/Design-Glassmorphic%20Command%20Center-purple?style=for-the-badge)](#signature-design-system)

TransitOps is a enterprise-grade, high-density fleet management and logistics dispatch platform. Built for modern transport hubs, the system integrates real-time telemetry, transactional business logic safeguards, automated scheduling, comprehensive fuel metrics, and role-based operational dashboards.

---

## 🌟 Executive Summary & Key Highlights

TransitOps goes beyond a simple CRUD interface by implementing a **"Fleet Command Center" design language** (glassmorphism, vibrant semantic indicators, high information density) alongside a **hardened backend database layer** enforcing real-time transactional business rules.

*   **100% Type-Safe Status States**: Backed by PostgreSQL `ENUM` columns and database-level constraint checks.
*   **Atomic Business Logic**: Dispatches, trip completions, maintenance closures, and availability state updates execute within atomic transaction blocks (`BEGIN/COMMIT`) to prevent database desync.
*   **Operational Safeguards**: Strict validation checks prevent double-booking of drivers/vehicles, load capacity violations, and dispatching drivers with expired licenses.
*   **Advanced Analytics & Cost Control**: Instant ROI tracking, stacked fuel/maintenance cost breakdown by vehicle, and real-time operational KPI grids.

---

## 🛠 Tech Stack

```mermaid
graph TD
    subgraph Client Layer (Vercel)
        A[React App / Vite] -->|Fetch / REST API| B[API Service Manager]
        A -->|CSS Variables| C[Signature Glassmorphic CSS]
    end
    
    subgraph Application Server (Render)
        B -->|JWT Auth Header| D[Express.js App]
        D -->|RBAC Middleware| E[Auth / Router Modules]
        E -->|db.query / pg-pool| F[Hardened Transaction Layer]
    end

    subgraph Database Layer (Neon Cloud)
        F -->|Secure SSL Connection| G[PostgreSQL Database]
        G -->|Trigger| H[Timestamp Auto-updates]
        G -->|Indexes| I[B-Tree Search Optimizations]
    end

    style A fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style D fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#fff
    style G fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fff
```

*   **Frontend**: React 18, Vite, React Router DOM, Chart.js (with react-chartjs-2), Material Symbols, Vanilla CSS (Glassmorphism design language).
*   **Backend**: Node.js, Express, `pg` (node-postgres with connection pooling), JSON Web Tokens (JWT), bcrypt.js.
*   **Database**: Neon Serverless PostgreSQL (with custom ENUMs, triggers, and indices).
*   **Hosting**: Vercel (Frontend Static hosting) & Render (Backend API).

---

## 🎨 Signature Design System

TransitOps implements a curated, dark-themed **Glassmorphic Command Center** layout using modern design tokens (located in [index.css](frontend/src/index.css)):

*   **Harmonious Color Space**: Utilizes a Material-3 inspired surface scale (lowest `#0b0e15` to bright `#363941`) paired with soft, glowing primary accents (`#4d8eff` container, `#10b981` success/available status, `#f59e0b` warning/cost).
*   **Glass Panels**: Backed by backdrop-filters: `blur(20px)` and subtle, translucent borders (`rgba(255,255,255,0.1)`) simulating ambient console lighting.
*   **Micro-Animations**: Hover-triggered translations, pulsing active badges (`.pulse-dot`), and skeleton loaders (`.skeleton`) for non-blocking content delivery.

---

## 🔒 Role-Based Access Control (RBAC) Matrix

To secure operations, TransitOps implements route-level and UI-level RBAC via JWT payloads. The platform features 4 distinct operational roles:

| Feature/Page | Fleet Manager | Driver | Safety Officer | Financial Analyst |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard Views** | Full access | Restricted | Safety focus | Finance focus |
| **Fleet Inventory (CRUD)** | ✅ Write | 🚫 No Access | 👁️ Read-Only | 👁️ Read-Only |
| **Driver Records (CRUD)** | ✅ Write | 🚫 No Access | ✅ Write | 🚫 No Access |
| **Dispatch / Trips** | ✅ Dispatch | 👁️ Read-Only | ✅ Dispatch | 🚫 No Access |
| **Maintenance Logs** | ✅ Write | 🚫 No Access | 👁️ Read-Only | 👁️ Read-Only |
| **Fuel / Expense Ledgers** | ✅ Write | ✅ Log Fuel | 🚫 No Access | ✅ Write |
| **Advanced ROI Reports** | ✅ Full | 🚫 No Access | 🚫 No Access | ✅ Full |

---

## ⚙️ Hardened Transactional Business Rules

The backend services (`trips.service.js` and `maintenance.service.js`) implement critical validation logic within atomic SQL transactions to ensure database consistency:

1.  **Vehicle Capacity Safeguard**:
    *   *Rule*: A trip cannot be dispatched if the cargo weight exceeds the vehicle's maximum load capacity limit.
    *   *Implementation*: Server checks `max_load_capacity_kg` in `vehicles` against the trip's `cargo_weight_kg`.
2.  **Driver Schedule Conflict Prevention**:
    *   *Rule*: A driver cannot be assigned to a new trip if they are currently on another trip (`On Trip`) or suspended.
    *   *Implementation*: Enforced via database checking of driver status before finalizing dispatch.
3.  **Active Vehicle Reservation**:
    *   *Rule*: Vehicles currently undergoing maintenance (`In Shop`) or assigned to an active trip (`On Trip`) cannot be dispatched.
    *   *Implementation*: Status-validation query running inside a transaction block checks the state of the vehicle before committing.
4.  **Automatic Availability Recovery**:
    *   *Rule*: Marking a trip as `Completed` or `Cancelled` must instantly restore the vehicle and driver status back to `Available`.
    *   *Rule*: Closing an open maintenance ticket (`Status: Closed`) must instantly make the vehicle `Available` again.
    *   *Implementation*: Combined database mutation executed using database `transaction` helpers (`BEGIN; UPDATE... UPDATE... COMMIT;`).

---

## 📊 Database Schema & Performance Optimizations

The schema includes targeted optimizations for high-throughput reads (necessary for real-time dashboard analytics):

*   **B-Tree Indexes**: Placed on lookup fields and foreign keys (`idx_vehicles_status`, `idx_drivers_status`, `idx_trips_status`, `idx_expenses_category`).
*   **Triggers**: Automatic audit tracking with update timestamp triggers (`update_timestamp()`) maintaining fields like `updated_at` across key tables.
*   **Constraints**: Double-layer constraints like `CHECK (cargo_weight_kg > 0)` and foreign key cascades to protect relational integrity.

The complete SQL schema definitions can be viewed in [db/schema.sql](backend/db/schema.sql).

---

## 🚀 Installation & Local Development

Follow these steps to run the complete environment locally:

### 1. Clone & Set Up Database
1. Create a local PostgreSQL instance (or Neon project).
2. Run the DDL setup script:
   ```bash
   psql -d <db_name> -f backend/db/schema.sql
   ```
3. Seed the initial operational dataset:
   ```bash
   psql -d <db_name> -f backend/db/seed.sql
   ```

### 2. Configure Environment Variables
Create a `.env` file in the `/backend` folder:
```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db_name>?sslmode=disable
JWT_SECRET=local-development-secret-key-12345
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
```

### 3. Run Backend Service
```bash
cd backend
npm install
npm run dev
```
The server will boot on `http://localhost:5000`. Test the endpoint via `http://localhost:5000/api/health`.

### 4. Run Frontend Dev Server
Create a `.env` file in the `/frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```
Run the development environment:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📄 CSV Export & Reporting
To facilitate offline review, every list page (Fleet, Trips, Maintenance, Expenses, Fuel Logs) is equipped with a standard-compliant **Export CSV** function. The output is processed on the client side via the unified `exportToCsv` module.

---

## 📈 Audit & Deployment Verification Checklist

The platform has been audited against the following core requirements:
- [x] **Database Integrity**: Primary/Foreign constraints verified, cascading triggers operational.
- [x] **Secure Cryptography**: Password storage uses robust `bcrypt` hashing with salt iterations.
- [x] **State-Machine Compliance**: Driver, vehicle, and trip status transition state machines verified.
- [x] **Visual Consistency**: Consistent implementation of the custom glassmorphism style across all views.
- [x] **Build Validation**: Verified code compiled and fully bundled.
