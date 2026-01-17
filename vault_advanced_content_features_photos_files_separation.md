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