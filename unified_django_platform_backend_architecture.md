# Unified Django Platform Backend Architecture

## Purpose
Design a **single, long-term Django backend** that powers **all current and future web applications** (Portfolio UI, Storage UI, future apps) with:
- Centralized authentication
- Local-first storage on Proxmox secondary disk
- Strong security boundaries
- Clean extensibility (no rewrites later)

This backend is a **platform backend**, not a single-project backend.

---

## High-Level Responsibilities

The backend must:

- Act as the **only API** for all frontends
- Own **authentication & authorization**
- Own **file storage** (local disk)
- Provide **versioned APIs**
- Support **future apps without structural changes**

---

## Deployment Context (Assumed)

- Proxmox VE host
- Django runs inside **one LXC or Docker container**
- Secondary storage mounted from Proxmox host → backend container
- Reverse proxy handled by **Nginx Proxy Manager**

Public access:
```
api.pariseashish.com → Django backend
```

---

## Core Design Principles

1. **One backend forever** – never create a second backend
2. **API-only Django** – no templates
3. **App-per-domain-logic** – clean separation
4. **Versioned APIs** – backward compatibility
5. **Local storage first** – no third-party dependency
6. **Security by default** – deny unless allowed

---

## Project Root Structure

```
backend/
├── manage.py
├── pyproject.toml / requirements.txt
├── core/                # Global config & glue
│   ├── settings/
│   │   ├── base.py
│   │   ├── prod.py
│   │   └── dev.py
│   ├── urls.py
│   ├── middleware.py
│   └── wsgi.py
│
├── apps/                # ALL business logic lives here
│   ├── accounts/        # Auth & identity
│   ├── files/           # Storage system
│   ├── portfolio/       # Portfolio APIs
│   ├── projects/        # Future projects
│   ├── audit/           # Logs & tracking
│   └── system/          # Health, limits, metrics
│
├── api/                 # API versioning & routing
│   ├── v1/
│   │   ├── urls.py
│   │   └── routers.py
│   └── permissions.py
│
├── shared/              # Reusable utilities
│   ├── permissions.py
│   ├── storage.py
│   ├── validators.py
│   └── exceptions.py
│
└── tests/
```

---

## Core App Responsibilities

### 1. `accounts` – Authentication & Identity

**Purpose:**
Single sign-on for all frontend apps

**Responsibilities:**
- User model
- JWT authentication
- Token refresh
- Permissions & roles

**Key Components:**
- Custom User model (UUID based)
- JWT (access + refresh)
- HTTP-only cookie auth

**Never:**
- Store frontend-specific auth logic

---

### 2. `files` – Personal Storage System

**Purpose:**
Own all file uploads, downloads, metadata, and access control.

**Storage Location:**
```
/data/   ← mounted Proxmox storage
```

**Logical Layout:**
```
/data/
└── users/
    └── <user_uuid>/
        ├── documents/
        ├── images/
        └── backups/
```

**Responsibilities:**
- Upload handling
- Secure download streaming
- Folder abstraction
- Quotas
- File metadata

**Rules:**
- Frontends NEVER access disk directly
- All access via authenticated API

---

### 3. `portfolio` – Portfolio APIs

**Purpose:**
Serve dynamic data for the portfolio UI

**Examples:**
- Projects list
- Skills
- Experience
- Contact submissions

This app **must not** contain auth or storage logic.

---

### 4. `projects` – Future Applications

**Purpose:**
Safe namespace for all future ideas:
- Dashboards
- Internal tools
- Analytics
- Admin-only apps

Rule:
> Every new idea becomes a Django app here — never a new backend

---

### 5. `audit` – Security & Accountability

**Purpose:**
Track sensitive activity without leaking data

**Examples:**
- Login attempts
- File access
- Deletions
- Permission changes

Logs should be:
- Minimal
- Structured
- Rotated

---

### 6. `system` – Platform Controls

**Purpose:**
Backend-only operational logic

Includes:
- Health check endpoint
- Storage usage stats
- Feature flags
- Rate limits

---

## API Layer Design

### Versioning

```
/api/v1/
```

Never break old clients.

### Routing

```
/api/v1/auth/
/api/v1/files/
/api/v1/portfolio/
/api/v1/system/
```

All routes:
- JSON only
- Auth required unless explicitly public

---

## Security Architecture (Baseline)

### Network
- Backend exposed ONLY via Nginx Proxy Manager
- No direct container IP access

### Application
- `DEBUG = False`
- Strict CORS
- CSRF protection
- Rate limiting

### Storage
- Files served via Django views
- Permission check before every download

---

## Data Storage

### Database
- PostgreSQL (recommended)
- UUID primary keys

### Files
- Local disk only
- Mounted from Proxmox host

No S3. No external dependency.

---

## Scaling Strategy (Future-Proof)

- Horizontal scale: add workers
- Storage scale: expand Proxmox disk
- App scale: add Django apps

**No architecture change required.**

---

## What This Architecture Guarantees

- One backend for life
- Clean growth path
- No vendor lock-in
- Strong security boundaries
- Professional-grade structure

---

## Next Logical Steps

1. Define exact **models** for `files`
2. Define **API contracts** (request/response)
3. Create **production Django settings**
4. Add **Dockerfile or LXC setup**
5. Implement **JWT auth flow**

Tell me which step you want next, and we build it precisely.
