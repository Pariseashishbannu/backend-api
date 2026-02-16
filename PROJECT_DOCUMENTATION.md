# Project Documentation

This file contains the merged documentation for the Unified Django Platform.

---

## 1. Architecture Overview
*(Source: unified_django_platform_backend_architecture.md)*

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

---
---

## 2. API Endpoints
*(Source: api_endpoints.md)*

# API Endpoints Documentation

**Base URL**: `http://localhost:8000/api/v1`

## Authentication (`apps.accounts`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/token/` | Obtain Access & Refresh Tokens. Body: `{username, password}` | No |
| `POST` | `/auth/token/refresh/` | Refresh Access Token. Body: `{refresh}` | No |
| `POST` | `/auth/token/verify/` | Verify Token validity. Body: `{token}` | No |

## File Storage (`apps.files`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/files/` | List all uploaded files | Yes |
| `POST` | `/files/` | Upload a file. Form-data: `file` | Yes |
| `GET` | `/files/{uuid}/` | Get file metadata | Yes |
| `DELETE` | `/files/{uuid}/` | Delete a file | Yes |
| `GET` | `/files/{uuid}/download/` | Download/Stream file content | Yes |

## Portfolio (`apps.portfolio`)

> **Note**: These endpoints are currently being implemented.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/portfolio/projects/` | List all projects | No (Public) |
| `GET` | `/portfolio/skills/` | List all skills | No (Public) |
| `GET` | `/portfolio/experience/` | List work experience | No (Public) |
| `POST` | `/portfolio/contact/` | Submit contact form. Body: `{name, email, message}` | No (Public) |

---
---

## 3. Proxmox Setup
*(Source: proxmox_setup.md)*

# Proxmox LXC & Secure Storage Setup Guide

## 1. Create LXC Container
Run this on your Proxmox Host Shell:
```bash
# Download Template (if needed)
pveam update
pveam download local debian-12-standard_12.2-1_amd64.tar.zst

# Create Container (replace <ID> with unique ID, e.g., 105)
pct create <ID> local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst \
  --hostname django-backend \
  --cores 2 --memory 2048 --swap 512 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --features nesting=1,keyctl=1
```

## 2. Mount Secure Storage (`sda`)
Assuming your secure physical drive is mounted on the Proxmox Host at `/mnt/sda/storage`.
We will bind-mount it to `/data` inside the container.

Run on Proxmox Host:
```bash
# Add bind mount config
pct set <ID> -mp0 /mnt/sda/storage,mp=/data
```
*Note: Ensure the directory `/mnt/sda/storage` exists on the host.*

## 3. Install Docker Inside LXC
Enter the container:
```bash
pct start <ID>
pct enter <ID>
```

Install Docker:
```bash
apt update && apt install -y curl
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## 4. Deploy Backend
Clone your repo or copy files to the LXC.
```bash
cd /path/to/backend
```

Create `.env` file for production:
```bash
DJANGO_SECRET_KEY=your_secure_random_key_here
DJANGO_ALLOWED_HOSTS=api.pariseashish.com,localhost
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=your_postgres_host_or_ip
DB_PORT=5432
```

Build and Run:
```bash
docker build -t django-backend .
docker run -d \
  --name backend \
  --restart always \
  -p 8000:8000 \
  -v /data:/data \
  --env-file .env \
  django-backend
```

## 5. Reverse Proxy (Nginx Proxy Manager)
Point your domain `api.pariseashish.com` to the LXC IP address on port `8000`.

---
---

## 4. Virtual Env Activation
*(Source: VENV_ACTIVATION.md)*

# Automatic virtualenv activation

This repo includes convenience settings and scripts to help automatically activate a Python virtual environment when you open a terminal.

What was added
- VS Code setting: `.vscode/settings.json` enables `python.terminal.activateEnvironment`.
- PowerShell helper: `scripts/auto_activate.ps1` — sources `.venv` or `venv` Activate.ps1 when present.

Quick instructions

- VS Code: Make sure the Python extension is installed. The workspace setting in `.vscode/settings.json` will let the extension auto-activate the selected interpreter's venv.

- PowerShell (recommended): Add the following line to your PowerShell profile (`$PROFILE`) so the repo’s venv is activated when you open a terminal in the project root or `cd` into it:

```
if (Test-Path ./scripts/auto_activate.ps1) { . ./scripts/auto_activate.ps1 }
```

To open your profile in Notepad and edit it, run:

```
if (!(Test-Path -Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }
notepad $PROFILE
```

- Bash / WSL: add this to your `~/.bashrc` or `~/.profile` if you want similar behavior:

```
if [ -f "./.venv/bin/activate" ]; then
  source ./.venv/bin/activate
elif [ -f "./venv/bin/activate" ]; then
  source ./venv/bin/activate
fi
```

Security note: these snippets only source `activate` scripts if they exist in the current working directory. Review any scripts before sourcing if you have security concerns.

If you’d like, I can add the PowerShell snippet directly to your `$PROFILE` now — say `yes` to proceed and I will append it.

---
---

## 5. Advanced Vault Features
*(Source: vault_advanced_content_features_photos_files_separation.md)*

# Vault Advanced Content Features – Photos & Files Separation

This document defines **advanced, user-facing features and backend logic** to clearly separate **Photos** and **Files** inside your Vault app, while keeping **zero-trust and military-grade security** intact.

This turns your Vault into a **Secure Google Photos + Secure Drive hybrid**, but self-hosted and zero-knowledge.

---

## 1. High-Level Feature Concept

Instead of a single "Files" bucket, Vault provides **content-aware vaults**:

- 📸 **Photos Vault** – media-optimized, previewable
- 📁 **Files Vault** – documents, archives, binaries
- 🔐 **Secrets Vault** – passwords, keys, notes

Each vault type has **different logic, UI, and security policies**, but shares the same encryption core.

---

## 2. Content Classification Logic (Backend)

### 2.1 File Type Detection

On upload, backend classifies content using **MIME type**, not extension.

```python
PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]

VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
]
```

Classification result:
- `type = photo`
- `type = video`
- `type = file`

Stored in DB (encrypted metadata).

---

## 3. Database Design (Extended)

### 3.1 Unified Storage Table

```sql
vault_objects (
  id UUID PRIMARY KEY,
  vault_id UUID,
  object_type VARCHAR, -- photo | file | video
  encrypted_metadata JSONB,
  encrypted_blob_path TEXT,
  size BIGINT,
  created_at TIMESTAMP
)
```

This allows:
- One storage engine
- Different UI experiences
- Same security model

---

## 4. Photos Vault – Features (Stunning UX)

### 4.1 Features

- Grid / Masonry view
- Client-side thumbnails (never stored unencrypted)
- Date-based grouping (Today / This Month / This Year)
- Camera metadata (EXIF – encrypted)

---

### 4.2 Secure Thumbnail Logic (Important)

```
Original Image
 → Client decrypts
 → Client generates thumbnail
 → Thumbnail encrypted
 → Stored separately
```

⚠️ Server never sees plaintext image.

---

### 4.3 Photos-Only Security Enhancements

- Screenshot detection (browser heuristic)
- Right-click disabled (UI deterrent)
- Optional watermark (client-side)

---

## 5. Files Vault – Features (Power User)

### 5.1 Features

- Folder hierarchy
- Drag-and-drop uploads
- File versioning
- Checksum integrity verification

---

### 5.2 File Integrity Logic

```python
sha256 = hash(file)
verify on download
```

Detects tampering or corruption.

---

## 6. Separate APIs (Clean Architecture)

### 6.1 Photos API

```
POST   /api/v1/photos/upload
GET    /api/v1/photos
GET    /api/v1/photos/{id}
```

### 6.2 Files API

```
POST   /api/v1/files/upload
GET    /api/v1/files
GET    /api/v1/files/{id}
```

Both route to the **same storage engine**, but enforce different rules.

---

## 7. Frontend UX Architecture (Next.js)

### 7.1 Routes

```
/dashboard/photos
/dashboard/files
/dashboard/secrets
```

### 7.2 UI Differences

| Feature | Photos | Files |
|------|------|------|
| Preview | Yes | Limited |
| Grid | Yes | No |
| Folder | No | Yes |
| Versioning | No | Yes |

---

## 8. Advanced Security Logic (Zero-Trust)

### 8.1 Object-Level Encryption Keys

Each photo/file has its **own key**:

```
Vault Key
 ↓
Object Key
 ↓
Encrypted Blob
```

Key deletion = secure deletion.

---

## 9. Storage Quota Enforcement (Smart)

- Photos quota
- Files quota
- Total vault quota

Example:
```
Photos: 100 GB
Files: 50 GB
```

Hard limits enforced server-side.

---

## 10. Performance Optimizations

- Chunked uploads
- Resumable uploads
- Streaming downloads
- Lazy decryption

---

## 11. Backup Strategy (Content-Aware)

- Photos: incremental snapshots
- Files: version-aware backups
- Secrets: DB snapshots

All encrypted.

---

## 12. Future Elite Features

- Face recognition (client-side only)
- Local AI photo search (no cloud)
- OCR on documents (client-side)
- Secure sharing links (time-limited)

---

## 13. Final Result

Your Vault becomes:

- 🔐 Secure Drive
- 📸 Secure Photos
- 🔑 Secure Secrets

All under:
- Zero-trust
- Zero-knowledge
- Military-grade encryption

---

## 14. Next Hardcore Builds

1. Photo encryption + thumbnail code
2. File versioning logic
3. Chunked upload implementation
4. Client-side EXIF encryption
5. UI wireframes for Photos vs Files

Say the number and we build it.

---
---

## 6. Vault Storage Quota
*(Source: vault_storage_quota_disk_usage_implementation_guide.md)*

# Vault Storage Quota & Disk Usage

This document explains how to expose **external SDA disk capacity**, **used storage**, and **remaining quota** inside your Vault application.

The design is **secure**, **production-ready**, and aligned with your:
- Proxmox host
- LXC bind-mounted storage (`/data`)
- Django backend
- Next.js frontend

---

## 1. Architecture Overview

```
External SDA Disk (Proxmox Host)
  ↓ mounted at
/mnt/vault-data
  ↓ bind-mounted into LXC
/data
  ↓
Django Backend (reads filesystem stats)
  ↓ REST API
Next.js Frontend (dashboard UI)
```

⚠️ The frontend **never** accesses disk directly.

---

## 2. Backend: Read Disk Capacity Safely

Linux provides filesystem statistics via `statvfs`.

### 2.1 Storage Utility

**`vault/utils/storage.py`**

```python
import os

def get_storage_stats(path="/data"):
    stats = os.statvfs(path)

    total = stats.f_blocks * stats.f_frsize
    free = stats.f_bavail * stats.f_frsize
    used = total - free

    return {
        "total_bytes": total,
        "used_bytes": used,
        "free_bytes": free,
        "total_gb": round(total / (1024**3), 2),
        "used_gb": round(used / (1024**3), 2),
        "free_gb": round(free / (1024**3), 2),
        "used_percent": round((used / total) * 100, 2)
    }
```

---

## 3. Backend: API Endpoint

### 3.1 Storage Stats API

**`vault/api/storage.py`**

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from vault.utils.storage import get_storage_stats

class StorageStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = get_storage_stats("/data")
        return Response(stats)
```

### 3.2 URL Configuration

**`vault/urls.py`**

```python
from django.urls import path
from vault.api.storage import StorageStatsView

urlpatterns = [
    path("api/v1/storage/stats", StorageStatsView.as_view()),
]
```

---

## 4. Security Controls

Recommended restrictions:

- Only authenticated users
- Optionally admin-only

Example:

```python
if not request.user.is_staff:
    return Response({"detail": "Forbidden"}, status=403)
```

---

## 5. Backend Testing

```bash
curl -H "Authorization: Bearer <TOKEN>" \
http://127.0.0.1:8000/api/v1/storage/stats
```

Example response:

```json
{
  "total_gb": 458.0,
  "used_gb": 12.4,
  "free_gb": 445.6,
  "used_percent": 2.7
}
```

---

## 6. Frontend: Fetch Storage Stats

### 6.1 API Call

```ts
export async function getStorageStats() {
  const res = await fetch("/api/v1/storage/stats", {
    credentials: "include",
  });
  return res.json();
}
```

---

## 7. Frontend: UI Component

```tsx
<div className="p-4 rounded-xl border">
  <h3 className="text-lg font-semibold">Storage Usage</h3>

  <div className="mt-2 h-3 bg-gray-200 rounded">
    <div
      className="h-3 bg-green-500 rounded"
      style={{ width: `${stats.used_percent}%` }}
    />
  </div>

  <p className="mt-2 text-sm text-gray-600">
    {stats.used_gb} GB used of {stats.total_gb} GB
  </p>

  <p className="text-sm text-gray-500">
    {stats.free_gb} GB remaining
  </p>
</div>
```

---

## 8. Optional: Per-User Storage Quota

### 8.1 Database Field

```sql
ALTER TABLE users ADD COLUMN storage_quota_gb INT DEFAULT 10;
```

### 8.2 Logic

```
remaining = user.storage_quota_gb - user_used_gb
```

This enables:
- Free vs paid plans
- Team-based quotas
- Soft & hard limits

---

## 9. Best Practices

✅ Read stats from `/data` only
✅ Cache values for 30–60 seconds
✅ Alert users at 80–90% usage

❌ Do NOT shell out to `df`
❌ Do NOT expose Proxmox APIs
❌ Do NOT mount disks inside LXC directly

---

## 10. Final Result

Your Vault app now shows:

- Total SDA disk capacity
- Used storage
- Remaining quota
- Visual usage bar

This matches **enterprise vault products** and is safe for self-hosted production.

---

### Next Enhancements

- Email alerts on low storage
- Quota enforcement on upload
- Snapshot-aware usage
- MinIO / S3 backend support

