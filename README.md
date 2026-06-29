# SnapLink — Scalable URL Shortener

A high-performance, production-ready URL shortener built with a modern full-stack architecture. This project demonstrates advanced backend concepts including caching, rate limiting, and relational database management.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router, TypeScript, Tailwind CSS) |
| **Backend** | Node.js + Express (ESM) |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache** | Redis (cache-aside pattern) |
| **Auth** | Google OAuth 2.0 + JWT |
| **Infra** | Docker Compose |

## ✨ Features

- **Base62 Short Codes** — nanoid-powered 7-char codes using `0-9a-zA-Z` alphabet, collision-resistant with up to 5 re-rolls
- **Custom Aliases** — create memorable short links like `/my-link`
- **Redis Caching** — cache-aside redirects for sub-millisecond response times; graceful fallback to Postgres if Redis is unavailable
- **QR Code Generation** — every short URL gets an auto-generated QR code (PNG or data URL)
- **Click Analytics** — track total clicks, browsers, devices, and referrers per URL
- **Google OAuth + JWT** — one-click sign-in, JWT token valid for 7 days, used on all protected routes
- **Rate Limiting** — 30 URL creates/15min, 200 redirects/min, 10 auth attempts/15min
- **Dashboard** — manage all your links, view stats, delete URLs

## 📁 Project Structure

```
url-shortener/
├── Backend/
│   ├── src/
│   │   ├── app.js                  # Express app + middleware
│   │   ├── config/
│   │   │   ├── db.js               # Prisma client
│   │   │   ├── redis.js            # Redis client (resilient)
│   │   │   └── passport.js         # Google OAuth strategy
│   │   ├── controllers/
│   │   │   ├── urlController.js    # Shorten, redirect, QR, stats
│   │   │   └── userController.js   # User URL management
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verification
│   │   │   └── rateLimiter.js      # express-rate-limit configs
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # /auth/google, /auth/me
│   │   │   ├── urlRoutes.js        # /url, /url/:code/qr, /url/:code/stats
│   │   │   └── userRoutes.js       # /user/urls
│   │   ├── services/
│   │   │   └── base62Service.js    # Collision-resistant code generation
│   │   └── utils/
│   │       └── generateShortCode.js# nanoid Base62 generator
│   ├── prisma/
│   │   └── schema.prisma           # User, Url, Analytics models
│   ├── server.js
│   └── Dockerfile
├── Frontend/
│   └── url-shortener-frontend/
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx            # Landing page
│       │   │   ├── dashboard/page.tsx  # User dashboard
│       │   │   ├── stats/[shortCode]/  # Analytics page
│       │   │   └── auth/callback/      # OAuth callback
│       │   ├── components/
│       │   │   ├── Navbar.tsx
│       │   │   ├── UrlShortenerForm.tsx
│       │   │   └── UrlCard.tsx
│       │   ├── context/AuthContext.tsx
│       │   └── lib/api.ts
│       └── Dockerfile (in Frontend/)
└── docker-compose.yml
```

## 🛠️ Setup

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis (optional — app works without it, just slower)
- Google OAuth credentials

### 1. Configure environment

```bash
# Backend
cp .env.example Backend/.env
# Fill in: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET

# Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > Frontend/url-shortener-frontend/.env.local
```

### 2. Run database migrations

```bash
cd Backend
npx prisma migrate dev
```

### 3. Start backend

```bash
cd Backend
npm run dev
```

### 4. Start frontend

```bash
cd Frontend/url-shortener-frontend
npm run dev
```

## 🐳 Docker (recommended)

```bash
# Create root .env from template
cp .env.example .env
# Fill in credentials

docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| PostgreSQL | localhost:5435 |
| Redis | localhost:6379 |

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/url` | Optional | Create short URL |
| `GET` | `/:shortCode` | — | Redirect to original URL |
| `GET` | `/url/:shortCode/qr` | — | Get QR code |
| `GET` | `/url/:shortCode/stats` | Required | Click analytics |
| `GET` | `/auth/google` | — | Start OAuth flow |
| `GET` | `/auth/google/callback` | — | OAuth callback |
| `GET` | `/auth/me` | Required | Current user |
| `GET` | `/user/urls` | Required | List my URLs |
| `DELETE` | `/user/urls/:shortCode` | Required | Delete my URL |
| `GET` | `/health` | — | Health check |

## 🚢 Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend + DB | Railway |
| Redis | Railway |

Remember to update `GOOGLE_CALLBACK_URL` in Google Cloud Console to your production backend URL.
