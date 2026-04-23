<div align="center">

# 🛡️ Visitor Management System

### A secure, full-stack visitor tracking solution for modern facilities

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**[🌐 Live Demo](https://guest-log.vercel.app/) · [📋 API Docs](#-api-endpoints) · [🚀 Quick Start](#-quick-start)**

---

</div>

## 📸 Screenshots

<div align="center">

| Dashboard | Login |
|:-:|:-:|
| ![Dashboard](frontend/assets/images/dashboard_preview.png) | ![Login](frontend/assets/images/login_preview.png) |

| Check-In Form |
|:-:|
| ![Check-In](frontend/assets/images/checkin_preview.png) |

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📋 **Smart Check-In/Out** | Register new visitors or quick check-in returning ones with auto-detection and visit history |
| 📊 **Live Dashboard** | Real-time stats — active visitors, today's visits, overstays, blacklisted — auto-refreshes every 30s |
| 🔒 **Role-Based Access** | 3 roles (Admin, Receptionist, Security) with tailored permissions and page restrictions |
| 🚫 **Blacklist System** | Flag & block visitors with logged audit trails; auto-denied at check-in |
| 🕐 **Overstay Detection** | Database triggers auto-update status when visitors exceed expected checkout time |
| 📝 **Reports & Logs** | Verification logs, visit sessions with date/status filters, pagination |
| 🚗 **Vehicle Tracking** | Vehicle number, type, and parking slot registration |
| 👥 **User Management** | Admin panel for creating, editing, and managing system users |
| ⚡ **Serverless Deploy** | Deployed on Vercel with Neon PostgreSQL — zero-config scaling |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  HTML5 + Vanilla CSS + JavaScript                   │
│  (Landing · Login · Dashboard · Check-In · Reports) │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────────┐
│                  BACKEND (Express.js)                │
│  JWT Auth · RBAC Middleware · Validation             │
│  Controllers · Routes · Error Handling               │
└──────────────────────┬──────────────────────────────┘
                       │ pg (node-postgres)
┌──────────────────────▼──────────────────────────────┐
│              DATABASE (PostgreSQL / Neon)            │
│  8 Tables · 5 Triggers · 4 Stored Procedures        │
│  3 Views · Indexes · Constraints                     │
└─────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `USER_ACCOUNT` | System users (Admin, Receptionist, Security) with hashed passwords |
| `VISITOR` | Visitor profiles with ID verification and blacklist status |
| `VISIT_SESSION` | Check-in/out records, host info, purpose, status tracking |
| `VEHICLE` | Visitor vehicle details and parking slot assignment |
| `SECURITY_OFFICER` | Security officers with shift assignments |
| `VERIFICATION_LOG` | Audit trail for all check-in/out/verification actions |
| `BLACKLIST_LOG` | History of blacklist add/remove operations |
| `SYSTEM_SETTINGS` | Configurable facility settings |

### Triggers & Automation

| Trigger | Function |
|---------|----------|
| `trg_log_checkin` | Auto-logs check-in to `VERIFICATION_LOG` |
| `trg_log_checkout` | Auto-logs check-out to `VERIFICATION_LOG` |
| `trg_check_overstay` | Auto-updates status to `Overstay` when past expected time |
| `trg_log_blacklist` | Auto-logs blacklist add/remove to `BLACKLIST_LOG` |
| `trg_*_updated_at` | Auto-updates `Updated_At` timestamp on row changes |

### Stored Procedures

- `sp_register_and_checkin()` — Register new visitor + create session in one transaction
- `sp_checkout_visitor()` — Check-out with validation
- `sp_get_active_visitors()` — Active visitors with duration calculation
- `sp_get_visitor_history()` — Complete visit history for a visitor

---

## 🔐 Role-Based Access Control

| Capability | Admin | Receptionist | Security |
|:-----------|:-----:|:------------:|:--------:|
| Dashboard | ✅ | ✅ | ✅ |
| Check-In Visitors | ✅ | ✅ | ❌ |
| Check-Out Visitors | ✅ | ✅ | ❌ |
| View Visitor List | ✅ | ✅ | ✅ |
| Edit Visitors | ✅ | ✅ | ❌ |
| Delete Visitors | ✅ | ❌ | ❌ |
| Blacklist Management | ✅ | ❌ | ❌ |
| Reports & Logs | ✅ | ❌ | ❌ |
| User Management | ✅ | ❌ | ❌ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, Vanilla CSS, JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon) |
| **Authentication** | JWT + bcrypt.js |
| **Validation** | express-validator |
| **Deployment** | Vercel (Serverless) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** (local) or [Neon](https://neon.tech/) account

### 1. Clone the Repository

```bash
git clone https://github.com/parvsshah/Visitor-Management-System.git
cd Visitor-Management-System
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

Create `backend/.env`:

```env
PORT=8000
NODE_ENV=development

# Database (Local PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/visitor_management_system

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Bcrypt
BCRYPT_ROUNDS=10
```

### 4. Set Up Database

```bash
# Create database and run schema
psql -U postgres -f database/schema_pg.sql

# Seed sample data
psql -U postgres -d visitor_management_system -f database/seed_pg.sql
```

### 5. Start the Server

```bash
npm run dev
# Server starts at http://localhost:8000
```

### 6. Open the App

Visit `http://localhost:8000` — you'll see the **landing page**, then navigate to **Login**.

---

## 🔑 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| 🔴 Admin | `admin` | `admin123` |
| 🟢 Security | `security1` | `admin123` |
| 🟡 Receptionist | `reception1` | `admin123` |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login → returns JWT |
| `GET` | `/api/auth/verify` | Verify token validity |

### Visitors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/visitors` | List all visitors (paginated, filterable) |
| `GET` | `/api/visitors/:id` | Get visitor details |
| `GET` | `/api/visitors/search?query=` | Search by name/contact/ID |
| `GET` | `/api/visitors/:id/history` | Get visit history |
| `POST` | `/api/visitors` | Create visitor |
| `PUT` | `/api/visitors/:id` | Update visitor |
| `DELETE` | `/api/visitors/:id` | Delete visitor (Admin) |
| `POST` | `/api/visitors/:id/blacklist` | Blacklist visitor |
| `DELETE` | `/api/visitors/:id/blacklist` | Remove from blacklist |

### Visit Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions/active` | Get currently checked-in visitors |
| `POST` | `/api/sessions/checkin` | New visitor check-in |
| `POST` | `/api/sessions/quick-checkin` | Returning visitor check-in |
| `PUT` | `/api/sessions/:id/checkout` | Check-out visitor |

### Reports (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/dashboard` | Dashboard statistics |
| `GET` | `/api/reports/verification-logs` | Verification log report |
| `GET` | `/api/reports/visit-sessions` | Visit session report |

### Users (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create user |
| `PUT` | `/api/users/:id` | Update user |
| `PUT` | `/api/users/:id/toggle-active` | Activate/deactivate user |

---

## 📁 Project Structure

```
Visitor-Management-System/
├── frontend/
│   ├── index.html          # Landing page (project showcase)
│   ├── login.html          # Authentication page
│   ├── dashboard.html      # Main dashboard with stats
│   ├── checkin.html        # Visitor check-in form
│   ├── checkout.html       # Visitor check-out
│   ├── visitors.html       # Visitor management table
│   ├── reports.html        # Reports & verification logs
│   ├── users.html          # User management (Admin)
│   └── assets/images/      # Preview images
├── backend/
│   ├── server.js           # Express app entry point
│   ├── config/db.js        # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication
│   │   └── errorHandler.js # Global error handler
│   ├── controllers/        # Business logic
│   ├── routes/             # API route definitions
│   └── utils/              # Validation & helpers
├── database/
│   ├── schema_pg.sql       # PostgreSQL schema + triggers
│   └── seed_pg.sql         # Sample data
├── api/index.js            # Vercel serverless entry
├── vercel.json             # Vercel deployment config
└── package.json
```

---

## 🌐 Deployment (Vercel)

The project is configured for **Vercel** serverless deployment:

1. **Push to GitHub**
2. **Import in Vercel** → Link your repository
3. **Add Environment Variables** in Vercel dashboard:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `JWT_SECRET` — Your JWT signing secret
4. **Deploy** — Vercel auto-detects `vercel.json` config

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by [Parv Shah](https://github.com/parvsshah)**

⭐ Star this repo if you found it helpful!

</div>
