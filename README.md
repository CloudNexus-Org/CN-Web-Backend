# Cloud Nexus — Backend API

Standalone Node.js + Express REST API with PostgreSQL (Prisma), JWT auth, admin 2FA, file uploads, and public routes for the marketing site. You can hand off **only this folder**; everything below is backend-specific.

## Requirements

- **Node.js** 20+
- **PostgreSQL** 14+ (local install, Docker, or managed host)
- **npm**

## Quick start

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET (required). Add SMTP_* for admin 2FA email.
npx prisma generate
npx prisma db push
npm run dev
```

- Health check: `http://localhost:4000/health` (or your `PORT`)
- API base: `http://localhost:4000` by default

## Scripts (`package.json`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Run API with `tsx watch` (hot reload) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled app (`node dist/index.js`) |
| `npm run db:generate` | Regenerate Prisma Client after schema changes |
| `npm run db:push` | Push schema to DB (dev / prototyping) |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run admin:create` | Create an admin user (see script output) |

For production schema changes, prefer **`prisma migrate`** workflows instead of `db push` when you have a migration history.

## Environment variables

Copy **`.env.example`** → **`.env`**. Never commit `.env`.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs (long random string) |
| `PORT` | No | Listen port (default `4000`) |
| `CORS_ORIGIN` | No | Comma-separated allowed browser origins (default `http://localhost:3000`). `localhost` and `127.0.0.1` variants are paired automatically. |
| `SMTP_*` | For admin 2FA email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| `ADMIN_OTP_EXPOSE_DEV_CODE` | No | Dev only: if `true`, OTP may be returned in API for debugging. **Never enable in production.** |

## HTTP routes (overview)

Mounted as in `src/index.ts`:

| Prefix | Module | Notes |
|--------|--------|--------|
| `/auth` | `routes/auth.ts` | User signup/login, **admin** signup/login, admin 2FA verify |
| `/applications` | `routes/applications.ts` | Job application **POST** (JWT + `multipart/form-data` field `resume`) |
| `/contacts` | `routes/contacts.ts` | Public contact / support form |
| `/blogs` | `routes/blogs.ts` | **GET** published posts (list + by slug) |
| `/job-listings` | `routes/jobListingsPublic.ts` | Public published job openings |
| `/admin` | `routes/admin.ts` | All routes require JWT + verified admin 2FA: blogs CRUD, job postings CRUD, applications list/approve/delete, contacts list, **`POST /admin/uploads/blog-image`** (multipart `file`) |

Static files:

- **`GET /uploads/*`** — Served from **`uploads/`** under the process working directory (typically this `backend/` folder). Contains `resumes/`, `blog-images/`, etc. **Add `uploads/` to `.gitignore` in production** or use object storage later.

## Database (Prisma)

- Schema: **`prisma/schema.prisma`**
- Main models: `User`, `JobPosting`, `JobApplication`, `BlogPost`, `ContactInquiry`, `AdminTwoFAChallenge`

After editing the schema:

```bash
npx prisma generate
npx prisma db push
```

If `generate` fails on Windows with a file lock, close editors using `node_modules/.prisma` and retry.

## CORS and local dev

The frontend often runs on `http://localhost:3000` while you may open `http://127.0.0.1:3000`. The server expands `CORS_ORIGIN` to allow both shapes when one is listed. Restart the API after changing `CORS_ORIGIN`.

## Security notes

- Keep **`JWT_SECRET`** private and rotate if leaked.
- Admin routes require **`role: ADMIN`** and **`admin2fa: true`** on the JWT after OTP verification.
- Upload routes validate file types where implemented; keep dependencies updated.

## Folder layout

```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.ts           # Express app entry
│   ├── env.ts
│   ├── lib/
│   ├── middleware/        # auth, admin 2FA
│   ├── routes/            # route modules
│   └── scripts/           # e.g. create-admin
├── uploads/               # generated at runtime (gitignored)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md              # this file
```

## Sharing only this repository

1. Zip or clone **this `backend/` directory** (plus your deployment process).
2. Recipient sets **`DATABASE_URL`** to their Postgres and **`JWT_SECRET`** to a new secret.
3. Run **`npm install`**, **`npx prisma generate`**, **`npx prisma db push`** (or migrations), then **`npm run build`** and **`npm start`** (or `npm run dev`).
4. Point their **frontend** or any client at the API base URL and set **CORS** to their site origin(s).

If the consumer is **not** using the bundled Next.js app, they do not need `frontend/` — only this API contract and env vars matter.
