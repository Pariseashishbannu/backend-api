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
