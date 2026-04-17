# Staging (Password-Protected) Deployment

This deploys:
- `/` storefront
- `/crm/` CRM
- `/api/*` backend API

Everything is protected with HTTP Basic Auth.

## 1) Build assets (local)

Copy `.env.example` to `.env` and set `STAGING_DOMAIN`.

From `deploy/staging`:

```powershell
Copy-Item .env.example .env
.\build-assets.ps1
```

## 2) Server prerequisites

- Docker + Docker Compose
- DNS: `STAGING_DOMAIN` points to the server

Generate the password hash on the server:

```bash
docker run --rm caddy:2 caddy hash-password --plaintext "yourPassword"
```

Put the hash into `BASIC_AUTH_HASH` in `deploy/staging/.env`.

## 3) Run on server

From `deploy/staging`:

```bash
cp .env.example .env
docker compose up -d --build
```

## 4) Database + uploads

- SQLite DB: `deploy/staging/data/db.sqlite`
- Uploads: `deploy/staging/uploads/`

## Notes

If you change routes/base paths:
- CRM is built with base `/crm/` (Vite `base` + React Router `basename`).

