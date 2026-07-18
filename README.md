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
| `VITE_API_BASE_URL` | Backend HTTP origin (e.g. `http://localhost:8000`) |
| `VITE_WS_BASE_URL` | Backend WebSocket origin (e.g. `ws://localhost:8000`) |

In the Clerk Dashboard, allow your app origins (e.g. `http://localhost:3000`, `http://localhost:5173`) and configure sign-in/sign-up redirect URLs for `/sign-in` and `/sign-up`.

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
