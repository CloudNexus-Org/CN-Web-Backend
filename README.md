# ⚙️ Cloud Nexus — Backend API Documentation (`CN-Web-Backend`)

Standalone Node.js + Express REST API built with TypeScript, PostgreSQL (via Prisma ORM), JWT authentication, Admin 2FA (email OTP), file upload engine, and public API endpoints.

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Environment Configuration (`.env`)](#-environment-configuration-env)
- [Step-by-Step Execution Guide](#-step-by-step-execution-guide)
  - [1. Database Setup](#1-database-setup)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Database Migration & Prisma Client](#3-database-migration--prisma-client)
  - [4. Seed Admin Account](#4-seed-admin-account)
  - [5. Run Development Server](#5-run-development-server)
  - [6. Run Production Server](#6-run-production-server)
- [Database Management (Prisma Studio)](#-database-management-prisma-studio)
- [Available NPM Scripts](#-available-npm-scripts)
- [API Routes Reference](#-api-routes-reference)
- [Folder Structure](#-folder-structure)

---

## ✨ Features

- **Authentication**: JWT-based security for standard users and verified administrators.
- **Admin 2FA Verification**: Multi-factor authentication via 6-digit email OTPs using Nodemailer (SMTP).
- **ORM & Database**: PostgreSQL database managed via Prisma ORM.
- **File Uploads**: Handles candidate resume uploads (`/applications`) and blog image uploads (`/admin/uploads/blog-image`).
- **Public & Admin APIs**: Complete separation of public marketing endpoints and protected admin dashboard routes.

---

## 📌 Prerequisites

Before running the backend, ensure you have installed:
- **Node.js**: v20.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14+ (Local installation or Docker container)

---

## 🔑 Environment Configuration (`.env`)

In the `CN-Web-Backend` directory, copy `.env.example` to `.env` or create `.env`:

```bash
cp .env.example .env
```

Configure the environment variables inside `.env`:

```env
# PostgreSQL Database Connection String
DATABASE_URL="postgresql://cn:cn_dev_password@localhost:5433/cloudnexus?schema=public"

# Secret Key for JWT Token Generation (Use a long 32+ character random string)
JWT_SECRET="replace_with_a_long_random_string_min_32_chars"

# Port on which Backend server listens
PORT=4000

# Allowed CORS Origins (Frontend URL)
CORS_ORIGIN=http://localhost:3000

# Admin 2FA Email SMTP Credentials (e.g., Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="Cloud Nexus <your_email@gmail.com>"

# Security Flag (Keep false in production so OTP is sent strictly via email)
ADMIN_OTP_EXPOSE_DEV_CODE=false

# Optional Chatbot Microservice URL
CHATBOT_SERVICE_URL=http://localhost:8000
```

---

## 🚀 Step-by-Step Execution Guide

### 1. Database Setup
Start a PostgreSQL container on port `5433` (or use your local PostgreSQL instance):

```powershell
docker run --name cloudnexus-db -e POSTGRES_USER=cn -e POSTGRES_PASSWORD=cn_dev_password -e POSTGRES_DB=cloudnexus -p 5433:5432 -d postgres:16-alpine
```

---

### 2. Install Dependencies
Navigate into `CN-Web-Backend` and install npm packages:

```powershell
cd CN-Web-Backend
npm install
```

---

### 3. Database Migration & Prisma Client
Generate the Prisma Client and push the schema to PostgreSQL:

```powershell
# Generate Prisma Client JS
npm run db:generate

# Push schema directly to PostgreSQL
npm run db:push
```

*(For production schema migrations, use `npm run db:migrate` instead).*

---

### 4. Seed Admin Account
To create an initial administrator account for logging into the admin panel:

```powershell
npm run admin:create
```
Follow the interactive CLI prompts to enter the admin name, email, and password.

---

### 5. Run Development Server
Start the backend API in development mode with automatic hot-reloading (`tsx watch`):

```powershell
npm run dev
```

- **API Base URL**: `http://localhost:4000`
- **Health Check Endpoint**: `http://localhost:4000/health`

---

### 6. Run Production Server
To compile TypeScript and start the production server:

```powershell
# Step 1: Build TypeScript to dist/
npm run build

# Step 2: Start compiled application
npm start
```

---

## 🗄️ Database Management (Prisma Studio)

You can launch a visual GUI interface to view, edit, and inspect database records (Users, Job Applications, Blogs, Contacts):

```powershell
npm run db:studio
```
*Opens Prisma Studio at `http://localhost:5555`*

---

## 📜 Available NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `tsx watch src/index.ts` | Start dev server with hot-reload |
| `build` | `tsc && node scripts/copy-assets.mjs` | Compile TypeScript to JavaScript in `dist/` |
| `start` | `node dist/index.js` | Run compiled production server |
| `db:generate` | `prisma generate` | Regenerate Prisma Client types |
| `db:push` | `prisma db push` | Push Prisma schema directly to DB |
| `db:migrate` | `prisma migrate deploy` | Deploy production database migrations |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI in browser |
| `admin:create` | `tsx src/scripts/create-admin.ts` | CLI tool to seed a new Admin user |

---

## 🔗 API Routes Reference

All endpoints are mounted in [`src/index.ts`](file:///c:/Users/Ritika%20Pankar/Desktop/Cloud-Nexus-Web/CN-Web-Backend/src/index.ts):

| Endpoint | Auth Required | Description |
|---|---|---|
| `GET /health` | No | Health check and server status |
| `POST /auth/register` | No | Register a standard user |
| `POST /auth/login` | No | Authenticate user & return JWT |
| `POST /auth/admin/login` | No | Step 1 Admin login (sends 2FA email OTP) |
| `POST /auth/admin/verify-2fa` | No | Step 2 Admin 2FA code verification (returns Admin JWT) |
| `GET /blogs` | No | Public list of published blog posts |
| `GET /blogs/:slug` | No | Get single published blog post by slug |
| `GET /job-listings` | No | Public list of active job postings |
| `POST /applications` | Optional JWT | Submit job application (`multipart/form-data` with `resume` file) |
| `POST /contacts` | No | Submit public contact form |
| `GET /admin/applications` | Admin 2FA JWT | List all job applications |
| `POST /admin/applications/:id/approve` | Admin 2FA JWT | Approve pending job application |
| `DELETE /admin/applications/:id` | Admin 2FA JWT | Delete application |
| `GET /admin/blogs` | Admin 2FA JWT | List all blogs (draft & published) |
| `POST /admin/blogs` | Admin 2FA JWT | Create new blog post |
| `PUT /admin/blogs/:id` | Admin 2FA JWT | Update existing blog post |
| `DELETE /admin/blogs/:id` | Admin 2FA JWT | Delete blog post |
| `POST /admin/uploads/blog-image` | Admin 2FA JWT | Upload image asset for blog content |

---

## 📂 Folder Structure

```
CN-Web-Backend/
├── prisma/
│   ├── schema.prisma       # Prisma models & DB schema
│   └── migrations/        # Schema migration history
├── scripts/
│   └── copy-assets.mjs    # Asset copy script for build step
├── src/
│   ├── index.ts           # Main entry point & server start
│   ├── app.ts             # Express app setup & middleware routing
│   ├── env.ts             # Dotenv loader
│   ├── config/            # Environment validation & CORS setup
│   ├── middleware/        # JWT auth, Admin 2FA guard, error handler
│   ├── routes/            # Route modules (auth, admin, blogs, etc.)
│   └── scripts/           # Admin creation script
├── uploads/               # Store uploaded resumes & blog images
├── package.json
└── tsconfig.json
```
