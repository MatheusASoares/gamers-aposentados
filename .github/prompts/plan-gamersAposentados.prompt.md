# Gamers Aposentados - Implementation Plan

## Project Status: ~92% Complete

**Current State:** Backend (90%) and Auth (100%) complete. UI Overhaul (Sidebar/Header) implemented. Auth pages refactored to modern dark theme. Project structure refactored into `(main)` and `(auth)` route groups. Level/XP system deferred to v1.1. **Dashboard Home redesigned** with glass-card dark theme, neon-glow effects, and real-time data from Prisma.

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

### Frontend Integration (85%)
- **Dashboard Home (NEW ✅):** Redesigned com glass-card tema escuro, neon-glow effects, dados reais do Prisma
  - `ActiveQuestHero`: Card hero para Main Quest ativa com cover image e gradient
  - `SideQuestBar`: Barra para Side Quest ativa com flame icon e progress
  - `StatsGrid`: Grid 3 colunas — Conquistas, Última Review, Backlog Burner
  - `RecentGames`: Feed de atividade recente com status badges
- `src/components/game/GameCard.tsx` renders games
- Modern Auth UI: `(auth)/login` & `(auth)/register` with Card design
- **Layout Components**: `Sidebar`, `Header`, `Breadcrumbs`, `MobileNav`

### Frontend Foundation (92%)
- UI Components: shadcn/ui primitives + Custom Layout + Dashboard Components
- Layout: Split into `(main)` (Dashboard) and `(auth)` (Centered)
- Config: Next.js 16, React 19, Tailwind CSS v4, Lucide Icons
- Theme: Dark theme com primary `#bd0df2`, glass-card, neon-glow effects

---

## What Was Done Last Session 🔨

### Dashboard Home Redesign (17/02/2026)
- **Updated `globals.css`**: Novo sistema de cores com `#bd0df2` roxo, glass-card, neon-glow, animações de entrada
- **Reescreveu `page.tsx`**: Server Component com parallel Prisma fetching (`Promise.all`)
- **Criou 4 components**: `ActiveQuestHero`, `SideQuestBar`, `StatsGrid`, `RecentGames`
- **Fixou Sidebar**: Link do Dashboard de `/dashboard` para `/`
- **Build verificado**: `npm run build` passou sem erros

---

## Remaining Work (Version 1.0 "The Last Mile")

### UI / Pages (Priority)
- `GET /games/new` - Page to add/nominate new games (Missing)
- `GET /quests` - Page to view all games with filters (Missing)
- `GET /randomizer` - Page to view pools and trigger randomizer (Missing)
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

### Phase 3: Core Features UI (IN PROGRESS)
1. (DONE) ~~Home page listing~~ → Dashboard Home com Hero, Side Quest, Stats, e Activity Feed
2. Create `/quests` listing/filtering page (NEXT)
3. Create `/games/new` nomination page
4. Create `/randomizer` management page
5. Create `/reviews` components and API

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
│   │   └── page.tsx (Dashboard Home - Redesigned ✅)
│   ├── api/
│   │   ├── auth/
│   │   ├── games/
│   │   └── pools/
│   ├── lib/
│   │   └── utils.ts
│   ├── layout.tsx (Root HTML/Body)
│   └── globals.css (Updated: dark theme, glass-card, neon-glow ✅)
├── components/
│   ├── auth/ (LoginForm, RegisterForm)
│   ├── dashboard/ (NEW ✅)
│   │   ├── ActiveQuestHero.tsx
│   │   ├── SideQuestBar.tsx
│   │   ├── StatsGrid.tsx
│   │   └── RecentGames.tsx
│   ├── game/ (GameCard)
│   ├── layout/ (Sidebar ✅, Header, MobileNav, Breadcrumbs)
│   └── ui/ (shadcn primitives)
├── lib/
│   ├── prisma.ts
│   ├── utils.ts
│   └── actions.ts
├── auth.ts
├── auth.config.ts
├── middleware.ts
└── types/
```

---

## Next Immediate Action

**Focus:** Build the Quests Listing Page.

1. Create `src/app/(main)/quests/page.tsx` for listing all games with filtering.
2. Create `src/app/(main)/games/new/page.tsx` for nominating new games.
3. Create `src/app/(main)/randomizer/page.tsx` for the pool randomizer.

---
