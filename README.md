# Scalable URL Shortener

A high-performance, production-ready URL shortener built with a modern full-stack architecture. This project demonstrates advanced backend concepts including caching, rate limiting, and relational database management.

## 🚀 Tech Stack

- **Frontend:** Next.js (Dashboard & Analytics)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis (High-speed redirects)
- **Auth:** Google OAuth + JWT
- **Infrastructure:** Docker, Vercel (Frontend), Railway (Backend/DB)

## ✨ Key Features

- **Base62 Encoding:** Collision-resistant, deterministic short URL generation.
- **High-Performance Redirects:** Cache-aside pattern using Redis to minimize database load.
- **Analytics Dashboard:** Real-time tracking of clicks, country, device, and referrer.
- **Security:** Rate limiting to prevent abuse and JWT-based protected routes.
- **Scalable Design:** Architecture ready for horizontal scaling and load balancing.

## 📁 Project Structure

```text
url-shortener/
├── Backend/      # Express API & Prisma Schema
├── Frontend/     # Next.js Application
├── Docker/       # Containerization configs
└── docs/         # Documentation
```

## 🛠️ Roadmap

1. [x] Project Setup & Prisma Initialization
2. [ ] URL Model & Creation API
3. [ ] Base62 Encoding Implementation
4. [ ] High-Speed Redirects with Redis
5. [ ] Google OAuth & JWT Integration
6. [ ] Analytics Tracking System
7. [ ] Next.js Dashboard UI
8. [ ] Dockerization & Deployment
