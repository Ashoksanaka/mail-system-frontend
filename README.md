# Bulk Email Dispatch Platform - Frontend

React SPA for the Bulk Email Dispatch Platform: templates, CSV uploads, attachments, and real-time dispatch monitoring. Authentication is handled by [Clerk](https://clerk.com).

## Tech Stack
- **Framework**: React.js, Vite
- **Auth**: Clerk (`@clerk/react`)
- **Styling**: Tailwind CSS, Shadcn/UI, Framer Motion
- **Data Visualization**: Recharts
- **Orchestration**: Docker, Nginx

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker + Docker Compose)
- A Clerk application with a publishable key
- Backend running on the `mail_system_net` Docker network (API/WebSocket proxy target)

## Environment

Copy `.env.example` to `.env` and set:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_...` / `pk_live_...`) |
| `VITE_API_BASE_URL` | Backend origin. Local: `http://localhost:8000` (or blank for Vite proxy). Production: **`https://<ip-dashes>.nip.io`** (Caddy on the AWS VM) |
| `VITE_WS_BASE_URL` | WebSocket origin. Local: `ws://localhost:8000`. Production: **`wss://<ip-dashes>.nip.io`** (optional if API URL is set — `wss://` is derived) |

### Vercel (HTTPS) + AWS backend (direct via nip.io)

Browsers block mixed content. On Vercel you **must** point at the Caddy HTTPS/WSS endpoint — never `http://` / `ws://` to the raw VM IP. No custom DNS is required: use nip.io (`13.60.91.88` → `https://13-60-91-88.nip.io`).

Set Production env vars in Vercel (match the VM `DOMAIN`):

```bash
VITE_API_BASE_URL=https://13-60-91-88.nip.io
VITE_WS_BASE_URL=wss://13-60-91-88.nip.io
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...   # or pk_test_...
```

The frontend `src/lib/endpoints.js` helper validates this at runtime and throws a clear error if an HTTPS page is configured with insecure API/WS URLs.

In the Clerk Dashboard, allow your app origins (e.g. `http://localhost:3000`, `http://localhost:5173`, `https://mailblasto.vercel.app`) and configure sign-in/sign-up redirect URLs for `/sign-in` and `/sign-up`.

Never put `CLERK_SECRET_KEY` or `CLERK_JWT_KEY` in the frontend.

## Getting Started

### Local Vite
```bash
npm install
npm run dev
```

### Docker
```bash
docker network create mail_system_net || true
docker-compose up --build -d
```

Vite variables are injected as Docker **build args** from `.env`.

## Auth behavior
- Public: `/`, `/sign-in/*`, `/sign-up/*`
- Protected: `/templates`, `/generate-csv`, `/upload-csv`, `/dispatch`, `/settings`
- API calls send `Authorization: Bearer <Clerk session token>`
- WebSockets send `{ type: "auth", token }` as the first message after connect

## SMTP settings
Each signed-in user must open **Settings** and save a Gmail App Password before dispatch.
The sender email is fixed to their Clerk signup address and cannot be edited in the UI.

## Service URLs
- **Frontend App:** http://localhost:3000

## Useful Commands
- **Tests:** `npm test`
- **View Logs:** `docker-compose logs -f frontend`
- **Stop service:** `docker-compose down`
