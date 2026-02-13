# Gamers Aposentados - Implementation Plan

## Project Status: ~90% Complete

**Current State:** Backend (90%) and Auth (100%) complete. UI Overhaul (Sidebar/Header) implemented. Auth pages refactored to modern dark theme. Project structure refactored into `(main)` and `(auth)` route groups. Level/XP system deferred to v1.1.

---

## What's Complete ✅

### Database Layer (100%)

- Schema: 6 Prisma models (users, games, reviews, pools, pool_entries + enums)
- Migrations: Applied to PostgreSQL
- Prisma Client: Singleton pattern configured in `src/lib/prisma.ts`

### Backend/API (90%)

- `src/app/api/games/route.ts` — CRUD implemented
- `src/app/api/pools/route.ts` — Randomizer logic implemented
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth v5 configured
- Middleware for protected routes (`middleware.ts`, `auth.config.ts`)

### Authentication & Authorization (100%)

- NextAuth v5 (Auth.js) integrated
- Credentials provider with bcrypt password hashing
- Login page (`/login`) and Register page (`/register`) implemented
- Protected routes configured

### Frontend Integration (75%)
- `src/app/(main)/page.tsx` fetches `/api/games`
- `src/components/game/GameCard.tsx` renders games
- Modern Auth UI: `(auth)/login` & `(auth)/register` with Card design
- **New Components**: `Sidebar`, `Header`, `Breadcrumbs`, `MobileNav`

### Frontend Foundation (90%)
- UI Components: shadcn/ui primitives + Custom Layout Components
- Layout: Split into `(main)` (Dashboard) and `(auth)` (Centered)
- Config: Next.js 16, React 19, Tailwind CSS v4, Lucide Icons

---

## Remaining Work (Version 1.0 "The Last Mile")

### UI / Pages (Priority)
- `GET /games/new` - Page to add/nominate new games (Missing)
- `GET /pools` - Page to view pools and trigger randomizer (Missing)
- `GET /reviews/[gameId]` - Page to view/add reviews (Missing)

### API
- `GET/POST /api/reviews` - Game reviews endpoints (Missing)
- `GET/POST /api/users` - User management endpoints (Missing/Partial via Auth)

### Version 1.1 (Deferred) 🔜
- **Gamification System**: Level, XP, Coins display in Header.
- **User Profile**: Complex user stats page `GET /users/[userId]`.
- **Shop**: Item store for spending coins.

---

## Implementation Roadmap

### Phase 1: Backend & Auth (COMPLETE)
1. (DONE) `/api/games` routes
2. (DONE) `/api/pools` routes
3. (DONE) Database Setup & Seeding
4. (DONE) Authentication (NextAuth, Middleware)

### Phase 2: UI Overhaul & Structure (COMPLETE)
1. (DONE) Sidebar & Header Implementation
2. (DONE) Layout Refactor `(main)` vs `(auth)`
3. (DONE) Modern Login/Register UI
4. (DONE) Mobile Responsiveness (Drawer Nav)

### Phase 3: Core Features UI (CURRENT)
1. (DONE) Home page listing
2. Create `/games/new` listing/nomination page (NEXT)
3. Create `/pools` management page
4. Create `/reviews` components and API

### Phase 4: Polish & Deploy
1. Error boundaries
2. Loading skeletons
3. Deployment

---

## Current File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx (Centered Auth Layout)
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── layout.tsx (Sidebar + Header Layout)
│   │   └── page.tsx (Dashboard Home)
│   ├── api/
│   │   ├── auth/
│   │   ├── games/
│   │   └── pools/
│   ├── components/
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── utils.ts
│   ├── services/
│   ├── layout.tsx (Root HTML/Body)
│   └── globals.css
├── components/
│   ├── auth/ (LoginForm, RegisterForm)
│   ├── game/ (GameCard)
│   ├── layout/ (Sidebar, Header, MobileNav, Breadcrumbs)
│   └── ui/ (shadcn primitives)
├── auth.ts
├── auth.config.ts
├── middleware.ts
└── types/
```

---

## Next Immediate Action

**Focus:** Build the Game Management UI.

1. Create `src/app/(main)/games/new/page.tsx` for adding games.
2. Create `src/app/(main)/pools/page.tsx` for managing the randomizer.

---
