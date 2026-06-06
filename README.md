# MediQueue Server

Express + TypeScript + PostgreSQL backend for MediQueue Tutor Booking System.

## 🔗 Live API

**Base URL:** [https://mediqueue-server-phi.vercel.app](https://mediqueue-server-phi.vercel.app)

**Health check:** [https://mediqueue-server-phi.vercel.app/api/health](https://mediqueue-server-phi.vercel.app/api/health)

## Architecture

```
src/
├── server.ts                  # Entry point — DB connect + graceful shutdown
├── app.ts                     # Express factory — middleware + routes
├── config/
│   └── db.ts                  # PostgreSQL pool connect/disconnect
├── db/
│   ├── pool.ts                # pg Pool singleton + typed query helper
│   └── migrate.ts             # Migration runner
├── controllers/
│   ├── auth.controller.ts
│   ├── tutor.controller.ts
│   └── booking.controller.ts
├── middleware/
│   ├── auth.middleware.ts     # JWT verify
│   └── error.middleware.ts    # Global error handler + 404
├── models/                    # Repository pattern — raw SQL queries
│   ├── user.repository.ts
│   ├── tutor.repository.ts
│   └── booking.repository.ts
├── routes/
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── tutor.routes.ts
│   └── booking.routes.ts
├── types/index.ts
└── utils/
    ├── AppError.ts
    └── sendResponse.ts

migrations/
├── 001_create_users.sql
├── 002_create_tutors.sql
└── 003_create_bookings.sql
```

## Setup

```bash
npm install
cp .env.example .env
# Fill DATABASE_URL and JWT_SECRET

npm run migrate   # Run SQL migrations
npm run dev       # Start dev server
```

## DATABASE_URL format


## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login → JWT |
| POST | /api/auth/jwt | — | Issue JWT (OAuth) |
| POST | /api/auth/google-mock | — | Dev mock |
| GET | /api/tutors | — | List (search + filter) |
| GET | /api/tutors/:id | — | Single tutor |
| POST | /api/tutors | ✅ | Create |
| PUT | /api/tutors/:id | ✅ owner | Update |
| DELETE | /api/tutors/:id | ✅ owner | Delete |
| POST | /api/bookings | ✅ | Book session |
| GET | /api/bookings | ✅ | My bookings |
| GET | /api/bookings/:id | ✅ | Single booking |
| PATCH | /api/bookings/:id/cancel | ✅ | Cancel |
# phero-b13-l1-a9
