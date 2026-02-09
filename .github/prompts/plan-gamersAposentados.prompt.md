# Gamers Aposentados - Implementation Plan

## Project Status: ~70% Complete

**Current State:** Backend and basic integration implemented. APIs for `games` and `pools` exist, local Postgres (Docker) configured, seed data created and applied, and frontend home page now fetches from the API.

---

## What's Complete ✅

### Database Layer (100%)

- Schema: 6 Prisma models (users, games, reviews, pools, pool_entries + enums)
- Migrations: 2 applied to PostgreSQL (init + schema_update)
- Prisma Client: Singleton pattern configured in `src/lib/prisma.ts`

### Backend/API (80%)

- `src/app/api/games/route.ts` — CRUD implemented with validation and field mapping
- `src/app/api/pools/route.ts` — list/create/draw/delete + randomizer transaction
- Error handling and basic validation added to API handlers

### Frontend Integration (80%)

- `src/app/page.tsx` now fetches `/api/games` and maps DB fields to `Game` type
- `src/components/game/GameCard.tsx` used to render games

### Frontend Foundation (40%)

- UI Components: GameCard + shadcn/ui primitives (Card, Badge, Separator, Button)
- Types: Game, GameStatus, QuestType, Player, GamePool fully defined
- Home Page: Prototype with mock data showing 2 GameCards
- Config: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Path aliases

### Code Quality

- No TODOs/FIXMEs scattered
- Clean, maintainable structure
- Proper naming conventions

---

## Critical Blocker: Backend/API (0%)

Without this, project remains prototype:

### Remaining API / Integration Work

- `GET/POST /api/reviews` - Game reviews (not yet implemented)
- `GET/POST /api/users` - User management (not yet implemented)
- Authentication / Authorization (NextAuth or similar)

### Supporting Infrastructure

- Environment variables (`.env.local` with DATABASE_URL)
- Authn/Authz (NextAuth.js or similar)
- Business logic (randomizer, validation rules)
- Seed data script

---

## Implementation Roadmap

### Phase 1: Backend Readiness (Priority 1)

1. (DONE) `/api/games` routes implemented
2. (DONE) Validation & error handling added
3. (DONE) `/api/pools` routes implemented with randomizer
4. Setup authn/authz (Next step)
5. (DONE) Seed script created and executed locally

### Phase 2: Frontend Integration (Priority 2)

1. (DONE) Removed mock data from home page and connected to `/api/games`
2. Create `/games` page listing (expand from home)
3. Create `/games/new` form for game nominations (TODO)
4. Create `/pools` page for viewing/triggering randomizer (UI TODO)
5. Create `/reviews/[gameId]` page (TODO)
6. Add authentication UI (login/signup) (TODO)

### Phase 3: Polish (Priority 3)

1. Error boundaries & error handling
2. Loading & skeleton states
3. Form validation feedback
4. Unit/integration tests
5. API documentation
6. Deployment (Vercel)

---

## Current File Structure

```
src/
├── app/
│   ├── page.tsx (Home - fetches /api/games)
│   ├── layout.tsx (Root, pt-BR)
│   ├── globals.css
│   ├── api/
│   │   ├── games/route.ts ✅
│   │   └── pools/route.ts ✅
│   └── components/ (empty)
├── components/
│   ├── game/
│   │   └── GameCard.tsx ✅
│   └── ui/ (shadcn primitives: badge, button, card, separator)
├── lib/
│   ├── prisma.ts ✅
│   └── utils.ts ✅
├── services/ ❌ EMPTY - ready for service layer
└── types/
    └── game.ts ✅
```

---

├── prisma/
│ ├── schema.prisma ✅
│ └── seed.ts ✅
├── .env.example
├── .env.local (created for local Docker)
└── types/
└── game.ts ✅

## Technical Decisions Made

- **ORM:** Prisma (good for Next.js)
- **Database:** PostgreSQL
- **UI Library:** shadcn/ui (Radix + Lucide)
- **Language:** Portuguese (comments + pt-BR)
- **Styling:** Tailwind CSS v4 + PostCSS
- **Routing:** Next.js App Router
- **State:** React (no external state manager introduced yet)

---

## Data Model Summary

**Game** - title, platform, cover_url, hltb_time, status (SUGGESTED|IN_POOL|ACTIVE|COMPLETED|DROPPED), questType (MAIN_QUEST|SIDE_QUEST), nominated_by_id, start_date, end_date

**Pool** - month, year, type, status (OPEN|CLOSED), winner_game_id, entries (pivot to users)

**User** - username, email, display_name, created_at

**Review** - rating, difficulty, review_text, hours_played, game_id, user_id

---

## Next Immediate Action

**Next immediate actions (pick one):**

- Implement authentication/authorization (recommended next step)
- Build UI for `Create Game` (`/games/new`) to allow nominations

If you want to run the project locally now, run:

```bash
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Notes:

- `.env.local` was created with the Docker Compose Postgres connection string `postgresql://user:password@localhost:5434/gamers_aposentados?schema=public`.
- APIs implemented: `GET/POST/PUT/DELETE /api/games`, `GET/POST/PUT/DELETE /api/pools` (with `draw` action).
- Remaining: users, reviews, authentication, UI forms/pages, admin flows.
