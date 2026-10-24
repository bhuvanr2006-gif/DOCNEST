# API endpoints

Interactive OpenAPI docs: `http://127.0.0.1:8000/docs`

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/token`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/me`

## Households
- `GET /api/households/mine`
- `GET /api/households/{id}/members`
- `POST /api/households/{id}/invitations`
- `POST /api/households/invitations/accept`
- `PATCH /api/households/{id}/members/{member_id}`

## Documents
- `POST /api/documents/upload`
- `GET /api/documents`
- `GET /api/documents/{id}`
- `PATCH /api/documents/{id}`
- `GET /api/documents/{id}/download`
- `POST /api/documents/{id}/verify`
- `POST /api/documents/{id}/tamper-demo`
- `DELETE /api/documents/{id}`
- `POST /api/documents/{id}/share`

## Assets, sharing, reminders, audit
- `GET/POST /api/assets`
- `PATCH/DELETE /api/assets/{id}`
- `GET /api/shares`
- `POST /api/shares/{id}/revoke`
- `GET /api/consent`
- `GET /api/reminders`
- `GET /api/notifications`
- `GET /api/audit`
- `GET /api/dashboard`
- `GET /api/security/status`
- `GET /api/health`
