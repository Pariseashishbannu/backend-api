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
