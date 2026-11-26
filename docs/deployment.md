# Production Deployment Guide — Nagrik Setu (नागरिक सेतु)

This guide covers deploying the **Nagrik Setu** grievance redressal portal and staff console to production environments.

---

## 1. System Architecture & Topology

```
                      ┌────────────────────────────────────────┐
                      │             Cloudflare / SSL           │
                      └───────────────────┬────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
                   ▼                                             ▼
       ┌───────────────────────┐                     ┌───────────────────────┐
       │     apps/web (SSR)    │                     │     apps/api (Node)   │
       │  Next.js 15 + React   │ ──(API Proxy /)───► │   Express 5 REST API  │
       │   + Staff Console SPA │                     │   + Duplicate Scorer  │
       └───────────────────────┘                     └───────────┬───────────┘
                   │                                             │
                   ▼                                             ▼
       ┌───────────────────────┐                     ┌───────────────────────┐
       │     MongoDB Atlas     │                     │     Redis 7 / BullMQ  │
       │   (Saved Watch Areas) │                     │   (Background Queue)  │
       └───────────────────────┘                     └───────────────────────┘
```

---

## 2. Option A: Cloud PaaS Deployment (Vercel + Render + MongoDB Atlas)

This option requires zero infrastructure maintenance and can run on free or low-cost cloud tiers.

### Step 1: Set up MongoDB Atlas (Free Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free M0 cluster.
2. In **Security > Network Access**, add `0.0.0.0/0` (Allow from anywhere) or your cloud host IPs.
3. In **Database Access**, create a user (e.g. `nagrik_admin`).
4. Copy the connection string:
   ```
   mongodb+srv://nagrik_admin:<password>@cluster0.mongodb.net/nagrik-setu?retryWrites=true&w=majority
   ```

### Step 2: Deploy Backend API to Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
2. Connect your GitHub repository: `https://github.com/Verto01/Smart-grievance-portal-with-fake-complaint-detection`.
3. Configure the service:
   - **Name:** `nagrik-setu-api`
   - **Environment:** `Node`
   - **Region:** Singapore (or nearest to your audience)
   - **Branch:** `main`
   - **Build Command:**
     ```bash
     npm ci && npm run build --workspace=@nagrik-setu/shared && npm run build --workspace=@nagrik-setu/domain && npm run build --workspace=@nagrik-setu/api
     ```
   - **Start Command:**
     ```bash
     node apps/api/dist/server.js
     ```
4. Add Environment Variables in the Render Dashboard:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGO_URI` = `mongodb+srv://...` (your Atlas URI)
   - `CLIENT_ORIGIN` = `https://your-frontend-domain.vercel.app`
   - `JWT_ACCESS_SECRET` = `(generate a 32+ character random secret)`
   - `JWT_REFRESH_SECRET` = `(generate a 32+ character random secret)`
   - `SESSION_VERIFY_SECRET` = `(generate a 32+ character random secret)`
   - `SSE_TICKET_SECRET` = `(generate a 32+ character random secret)`
   - `STORAGE_DRIVER` = `local` (or `s3` with AWS S3 credentials)
5. Deploy. Copy the live API URL: `https://nagrik-setu-api.onrender.com`.

### Step 3: Deploy Frontend Portal to Vercel
1. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import the GitHub repository.
3. Configure the project:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Edit to select `apps/web`.
   - **Build Command:**
     ```bash
     npm run build --workspace=@nagrik-setu/shared && npm run build --workspace=@nagrik-setu/admin && mkdir -p public/staff && cp -r ../admin/dist/* public/staff/ && next build
     ```
4. Set Environment Variables:
   - `API_BASE_URL` = `https://nagrik-setu-api.onrender.com`
   - `MONGO_URI` = `mongodb+srv://...` (for server actions and saved areas)
5. Click **Deploy**.

---

## 3. Option B: Unified Docker VPS Deployment (1-Command Production Stack)

For deployment on any Linux VPS (Ubuntu 22.04 / 24.04 on AWS EC2, DigitalOcean, Hetzner, or Linode).

### Step 1: Install Docker & Docker Compose
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
```

### Step 2: Clone & Configure
```bash
git clone https://github.com/Verto01/Smart-grievance-portal-with-fake-complaint-detection.git
cd "Smart-grievance-portal-with-fake-complaint-detection"

# Copy environment template
cp .env.example .env
```

Edit `.env` and set secure secrets:
```bash
nano .env
```

### Step 3: Launch the Production Stack
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Seed Production Data & Demo Users
```bash
docker compose -f docker-compose.prod.yml exec api node dist/server.js # or run seed script
```

### Service Ports:
- **Web Frontend & Staff Console:** `http://<YOUR_IP>:3000`
- **Backend API:** `http://<YOUR_IP>:4000`
- **MongoDB:** Internal docker network (`mongo:27017`)
- **Redis:** Internal docker network (`redis:6379`)

---

## 4. Production Verification Checklist

| Check | Requirement | Verified Status |
|---|---|---|
| **Health Checks** | `GET /health` returns 200 OK | Verified |
| **Bilingual NLP** | English and Hindi grievances classified correctly | Verified |
| **SLA Tracking** | Urgent hazard issues auto-trigger 50% accelerated SLA | Verified |
| **Zero-Trust Media** | EXIF stripped, GPS validated, perceptual hash checked | Verified |
| **Anonymous Reporting** | Identity hidden from public endpoints and exports | Verified |
| **Duplicate Clustering** | Spatial-temporal-semantic hybrid scorer operational | Verified |
| **Staff RBAC** | Ward Officer, Dept Admin, and Reviewer console access | Verified |
| **Audit Log** | Immutable transition and override records recorded | Verified |
