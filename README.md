# Bulk Email Dispatch Platform - Frontend

This repository contains the frontend React SPA for the Bulk Email Dispatch Platform, providing a modern dashboard for templates, CSV uploads, attachments, and real-time dispatch monitoring.

## Tech Stack
- **Framework**: React.js, Vite
- **Styling**: Tailwind CSS, Shadcn/UI, Framer Motion
- **Data Visualization**: Recharts
- **Orchestration**: Docker, Nginx

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker + Docker Compose)
- Ensure the backend service is running on the `mail_system_net` docker network, as the frontend proxies API requests to it.

## Getting Started

1. Create the external docker network (if not already created by backend or manually):
   ```bash
   docker network create mail_system_net || true
   ```

2. Start the frontend service:
   ```bash
   docker-compose up --build -d
   ```

## Service URLs
- **Frontend App:** http://localhost:3000

## Usage Guide
### 1. Creating a Template
1. Navigate to the **Templates** page.
2. Click **New Template**.
3. Use `{{placeholders}}` (e.g., `Hello {{first_name}}`) to personalize emails.
4. Enable attachments if needed, and configure for global or per-recipient files.

### 2. Generating & Uploading CSV Data
1. Select your saved template and click **Use This Template**.
2. Download the auto-generated CSV. Fill it with data and upload it back.
3. If applicable, upload global attachments or per-row attachments directly in the table.

### 3. Dispatch and Monitoring
1. Click **Start Dispatch**.
2. Watch the real-time progress on the Dashboard.

## Useful Commands
- **View Logs:** `docker-compose logs -f frontend`
- **Stop service:** `docker-compose down`
