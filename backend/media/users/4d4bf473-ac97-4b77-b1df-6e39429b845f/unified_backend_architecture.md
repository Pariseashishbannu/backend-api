# 🧱 Unified Backend Architecture for Multiple Next.js Apps

**Author:** Parise Ashish  
**Purpose:** Design a single, secure, scalable backend to serve multiple Next.js frontend applications running on Proxmox.

---

## 🎯 Mission Objective

Create **one backend system** that:

- Serves **multiple Next.js applications** (portfolio, projects, storage UI, admin tools)
- Acts as the **single source of truth** for all data
- Is **secure by default**, minimal, and extensible
- Runs reliably in a **Proxmox homelab / self-hosted environment**
- Uses **Docker** for isolation and reproducibility

---

## 🏗️ High-Level Architecture

```
                     Internet
                         |
                   Cloudflare DNS
                         |
                 Nginx Proxy Manager
                         |
        ┌────────────────┴────────────────┐
        │                                 │
 Next.js App (Portfolio)        Next.js App (Projects)
 pariseashish.com               projects.pariseashish.com
 PM2 / Docker                   PM2 / Docker
        │                                 │
        └──────────────┬──────────────────┘
                       │
              Unified Backend API
            api.pariseashish.com (Django)
                       │
                PostgreSQL Database
                Encrypted File Storage
```

---

## 🧠 Core Design Principles

1. **Backend-first architecture**  
   Frontends are replaceable. Backend is permanent.

2. **Single Source of Truth**  
   All data, auth, permissions live in one backend.

3. **Stateless APIs**  
   JWT-based auth. No sessions.

4. **Zero Trust Internals**  
   Every request is authenticated and validated.

5. **Infrastructure Minimalism**  
   Fewer moving parts = fewer failures.

---

## 🧩 Component Breakdown

### 1️⃣ Frontend Layer (Multiple Next.js Apps)

**Responsibilities:**
- UI / UX
- Client-side routing
- API consumption
- Authentication token storage

**Characteristics:**
- No business logic
- No database access
- Stateless

**Examples:**
- Portfolio App
- Projects App
- Admin Dashboard

---

### 2️⃣ API Gateway / Reverse Proxy

**Tool:** Nginx Proxy Manager

**Responsibilities:**
- Domain-based routing
- SSL termination (Let’s Encrypt)
- Forward requests to internal services

**Example Routing:**

| Domain | Target |
|------|-------|
| pariseashish.com | 127.0.0.1:3000 |
| projects.pariseashish.com | 127.0.0.1:3001 |
| api.pariseashish.com | 127.0.0.1:8000 |

---

### 3️⃣ Unified Backend (Django)

**Runs as:** Docker container  
**Exposure:** Internal only (proxied)

#### Backend Responsibilities
- Authentication (JWT)
- Authorization (roles, permissions)
- Data storage
- File handling
- API versioning

#### Backend Structure

```
backend/
├─ app/
│  ├─ core/          # settings, urls
│  ├─ users/         # auth, JWT, roles
│  ├─ storage/       # secure data storage
│  ├─ projects/      # portfolio projects
│  ├─ files/         # uploads / downloads
│  └─ analytics/     # future
├─ Dockerfile
├─ docker-compose.yml
└─ .env
```

---

## 🔐 Authentication & Authorization

### Authentication

- **JWT (JSON Web Tokens)**
- Stateless
- Short expiry

**Flow:**
```
Next.js App → /auth/login → JWT
JWT → Authorization Header → All APIs
```

### Authorization

- Role-based access (RBAC)
- Example roles:
  - admin
  - user
  - readonly

---

## 🧪 API Design Standards

### API Versioning

```
/api/v1/auth/
/api/v1/storage/
/api/v1/projects/
/api/v1/files/
```

### Request Rules

- JSON only
- HTTPS only
- Authorization header required

---

## 🗄️ Data Layer

### Database

- PostgreSQL (recommended)
- Single database
- Encrypted disk / volume

### File Storage

- Local encrypted volume (initial)
- Upgrade path to object storage

---

## 🐳 Containerization Strategy

### Backend Container

- Django + Gunicorn
- Non-root user
- Internal port only

### Frontend Containers (Optional)

- React / Next.js
- Static builds via Nginx

---

## 🛡️ Security Posture

- Backend not publicly exposed
- Strict CORS
- JWT expiration
- Rate limiting
- No admin panel exposed
- Secrets via environment variables

---

## 📦 Deployment Model (Proxmox)

- Proxmox VE
- Ubuntu LXC
- Docker inside LXC
- PM2 for Next.js apps

---

## 🔄 Data Flow Example

```
User
 → Next.js App
   → api.pariseashish.com/api/v1/storage
     → Django View
       → Database
       ← Response
   ← UI Update
```

---

## 🚀 Scalability Path

- Add more Next.js apps without backend changes
- Add new Django apps (modules)
- Swap DB to managed Postgres later
- Add background workers (Celery)

---

## 🧠 Why This Architecture Works

- Industry-standard
- Startup-ready
- Homelab-friendly
- Secure by default
- Easy to reason about

This is the same **core architecture** used by:
- SaaS platforms
- Internal enterprise tools
- Multi-frontend ecosystems

---

## 🏁 Conclusion

You now have:

- One backend for all apps
- Clean separation of concerns
- A system that can grow without rewrites

This architecture turns your setup from **projects** into a **platform**.

---

## 🔮 Optional Future Enhancements

- mTLS internal traffic
- Zero-trust device identity
- Audit logging
- AI-powered search
- Mobile app clients

---

**Status:** Production-ready foundation ✅

