# Nagrik Setu (नागरिक सेतु)

> **Smart Grievance Redressal & Fake Complaint Detection System**  
> A high-trust municipal civic grievance management platform featuring automated duplicate clustering, image forensics (ELA), trust scoring, and SLA-driven routing.

[![CI](https://github.com/Verto01/Smart-grievance-portal-with-fake-complaint-detection/actions/workflows/ci.yml/badge.svg)](https://github.com/Verto01/Smart-grievance-portal-with-fake-complaint-detection/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)

---

## Overview

Nagrik Setu provides an end-to-end civic grievance lifecycle designed for municipal corporations and citizens:

1. **Citizen Portal (`apps/web`)**: Next.js App Router progressive web application for reporting civic issues, real-time tracking, geolocation picking, and public statistics.
2. **Staff & Review Console (`apps/admin`)**: React + Vite single-page application for field officers and reviewers to manage workloads, inspect image evidence, verify SLA deadlines, and resolve complaints.
3. **Core API & Worker (`apps/api`)**: Express 5 service powering authentication, RBAC, media streaming, and asynchronous grievance analysis.
4. **Domain & Schemas (`packages/domain`, `packages/shared`)**: Shared Mongoose contracts, Zod boundary validation schemas, and state machine lifecycle transitions.

```
                              ┌───────────────────────────────────────────────┐
                              │            Citizen Web App (Next.js)          │
                              │  - Report wizard with direct media upload     │
                              │  - SSR tracking & live timeline               │
                              │  - SSG / ISR public city statistics & SLA     │
                              └──────────────────────┬────────────────────────┘
                                                     │ REST / Server Actions
                                                     ▼
┌─────────────────────────────┐               ┌───────────────────────────────┐
│ Staff Console (React + Vite)│──────────────►│    Express 5 API & Worker     │
│ - Officer queue & SLA clock │   REST API    │  - JWT Auth + Rotation        │
│ - Reviewer Workbench        │               │  - RBAC Middleware            │
│ - ELA forensics viewer      │               │  - Media presigning (R2/disk) │
└─────────────────────────────┘               └──────────────┬────────────────┘
                                                             │
                                     ┌───────────────────────┴───────────────────────┐
                                     │                                               │
                                     ▼                                               ▼
                      ┌─────────────────────────────┐                 ┌─────────────────────────────┐
                      │    MongoDB (GeoJSON 2dsphere)│                │     AI Analysis Pipeline     │
                      │  - Complaints & Status Log  │                 │  - DCT pHash & SHA-256      │
                      │  - Audit Trail (append-only)│                 │  - ELA & Noise Forensics    │
                      │  - Jurisdictional Wards     │                 │  - Trust Scorer (11 signals)│
                      └─────────────────────────────┘                 │  - Duplicate Scorer & Router│
                                                                      └─────────────────────────────┘
```

---

## Key Architecture & Design Principles

### 1. Verification over Auto-Rejection
No citizen grievance is ever auto-rejected based on machine learning signals alone. Low-trust complaints or perceptual matches are flagged to human reviewers as **"Needs Verification"** on the citizen portal, preserving trust and due process.

### 2. Direct-to-Storage Media Intake
Large image files never transit through serverless function memory. The browser requests short-lived presigned upload URLs constrained by size ($\le 10\text{ MB}$) and MIME types (JPEG, PNG, WebP), uploading directly to object storage. The backend verifies magic bytes (`0xFFD8FF`, `0x89504E47`, `RIFF...WEBP`) and strips GPS EXIF data from public derivatives.

### 3. Spatial Privacy
Coordinates on public map views and unauthenticated feeds are rounded to a 3-decimal place grid (~111m) to prevent personal home identification. Anonymous grievances omit reporter identities across all public DTOs.

### 4. Single Authoritative Writer
All complaint domain mutations and status transitions are owned by the Express API service and `packages/domain`. Next.js acts as a thin backend-for-frontend layer for citizen-facing queries and mutations.

---

## AI Analysis Pipeline

Each submitted grievance passes through an idempotent stage-by-stage analysis pipeline:

1. **Ingest**: Image decoding via `sharp`, orientation normalization, creation of public 1280px derivative (EXIF stripped) and 224px thumbnail.
2. **Fingerprint**: SHA-256 byte hashing, 64-bit Discrete Cosine Transform (DCT) perceptual hash (`pHash`), and gradient difference hash (`dHash`).
3. **EXIF Summary**: Extraction of GPS coordinates, timestamp, camera model, and detection of editing software tags (Photoshop, Snapseed, GIMP, etc.).
4. **Forensics (ELA)**: Error Level Analysis at quality 90 computing region variance ratio and Laplacian noise block anomalies.
5. **VLM & Fallback Classifier**: Vision-language categorization with structured Zod validation, backed by an English/Hindi keyword classifier.
6. **Duplicate Scoring**: Multi-signal similarity ranking:
   $$\text{Score} = 0.35 \cdot \text{imgSim} + 0.30 \cdot \text{embedSim} + 0.15 \cdot \text{textSim} + 0.10 \cdot \text{distScore} + 0.10 \cdot \text{sameCat}$$
   *Safety Invariant:* Geographic proximity alone can never trigger an auto-merge. Visual similarity is mandatory for high-confidence duplicate linking.
7. **Trust Scoring**: Starts at 100 with explainable deductions (EXIF mismatch: -30 to -40; editing software: -15; cross-user reuse: -40; camera GPS bonus: +10).

---

## Evaluation Benchmark

Run the synthetic benchmark suite to evaluate duplicate detection and categorization:

```bash
npm run eval
```

Measured results on synthetic benchmark:

| Metric | Target | Measured Result | Status |
|---|---|---|---|
| Duplicate Precision | $\ge 90\%$ | **100.0%** | PASS |
| Duplicate Recall | $\ge 85\%$ | **100.0%** | PASS |
| False Merge Rate | $\le 5\%$ | **0.0%** | PASS |
| Bilingual Text Classification | $\ge 85\%$ | **100.0% (20/20)** | PASS |

Detailed test breakdowns are saved in [docs/evaluation.md](docs/evaluation.md).

---

## Monorepo Structure

```
├── apps/
│   ├── web/          # Next.js 15 App Router (Citizen Portal)
│   ├── admin/        # React 19 + Vite (Staff & Reviewer Console)
│   └── api/          # Express 5 REST API & Worker
├── packages/
│   ├── domain/       # Mongoose models, AI core services, DTO transformers
│   └── shared/       # Zod validation schemas, enums, state machine transitions
├── docs/             # Technical architecture, requirements, evaluation report
└── scripts/          # Database seeding and evaluation benchmark CLI
```

---

## Getting Started

### Prerequisites
- **Node.js**: $\ge 20.0.0$
- **MongoDB**: $\ge 7.0$ (running locally or MongoDB Atlas)

### 1. Installation

```bash
git clone https://github.com/Verto01/Smart-grievance-portal-with-fake-complaint-detection.git
cd Smart-grievance-portal-with-fake-complaint-detection
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `MONGO_URI` points to your running MongoDB instance (e.g., `mongodb://localhost:27017/nagrik-setu`).

### 3. Seed Municipal Data

Seed initial Chandigarh wards (GeoJSON 2dsphere polygons), departments, categories, and SLAs:

```bash
npm run seed
```

### 4. Running the Development Servers

```bash
# Start API server (port 4000)
npm run dev:api

# In another terminal: start Citizen Portal (port 3000)
npm run dev:web

# In another terminal: start Staff Console (port 5173 or accessed via /staff)
npm run dev:admin
```

---

## Verification & Testing

Run all quality checks across the monorepo:

```bash
# Typecheck all workspaces
npm run typecheck

# Run test suite (178 unit & integration tests)
npm test

# Run evaluation benchmark
npm run eval

# Production build for all apps
npm run build
```

---

## Production Deployment

Detailed step-by-step instructions for deploying to cloud providers and Docker VPS are in **[docs/deployment.md](docs/deployment.md)**.

### Quick Start with Docker Compose (Production Stack)

Deploy MongoDB, Redis, API, and Next.js Web with a single command:

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Build and launch all production containers in background
docker compose -f docker-compose.prod.yml up -d --build

# 3. Access applications:
#    Citizen Web Portal & Staff Console: http://localhost:3000 (or http://<YOUR_IP>:3000)
#    Backend REST API:                  http://localhost:4000
```

### Cloud PaaS Deployment (Render + Vercel + MongoDB Atlas)
- **Backend API:** Deploy to [Render.com](https://render.com) using the included `render.yaml` blueprint with MongoDB Atlas.
- **Frontend Portal:** Import `apps/web` into [Vercel](https://vercel.com) with `API_BASE_URL` pointing to your Render API.

---

## Known Limitations

1. **ELA False Positives**: Recompression artifacts can vary across smartphone camera encoders and social messaging compressions; ELA output is treated strictly as an indicator for human review, never as automated proof of forgery.
2. **Offline Geolocation**: Reverse geocoding degrades gracefully to raw coordinates if external geocoding providers are unreachable.
3. **Jurisdictional Boundaries**: Seed ward polygons are synthetic boundaries modeled for Chandigarh sectors; real-world deployment requires official municipal GIS shapefiles.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
