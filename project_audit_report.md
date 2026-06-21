# Gamers Aposentados - Project Audit Report

This report presents a thorough analysis of the codebase for the **Gamers Aposentados** application. The audit focused on finding critical bugs, security vulnerabilities, performance bottlenecks, and code quality improvements in Server Actions, API routes, React components, and database configurations.

---

## 🔍 Table of Contents

1. [🚨 Critical Bugs & Compile Errors](#1-critical-bugs--compile-errors)
2. [🛡️ Security & Authorization Vulnerabilities](#2-security--authorization-vulnerabilities)
3. [⚡ Performance & Scaling Issues](#3-performance--scaling-issues)
4. [🛠️ Database & Transaction Integrity Gotchas](#4-database--transaction-integrity-gotchas)
5. [🧑‍💻 Code Quality & Next.js Anti-patterns](#5-code-quality--nextjs-anti-patterns)
6. [📋 Actionable Recommendations Summary](#6-actionable-recommendations-summary)

---

## 🚨 1. Critical Bugs & Compile Errors - COMPLETED

### 1.1 Impure Function in Render (Build Blocker)

- **File:** [page.tsx](<file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/(main)/page.tsx#L38>)
- **Impact:** **Critical (Build Failure)**
- **Details:** Line 38 attempts to shuffle reviews directly inside the body of a Server Component render using `Math.random()`. This violates React's component purity rules (idempotency) and triggers a strict ESLint compilation error (`react-hooks/purity`), completely blocking production builds:
    ```typescript
    // C:\Users\mathe\Desktop\gamers-aposentados\src\app\(main)\page.tsx:38:38
    const j = Math.floor(Math.random() * (i + 1)); // Cannot call impure function
    ```
- **Solution:** Shuffle the data in a dedicated data fetching utility function outside the render path, or use database-native shuffling (e.g. `ORDER BY random()`).

### 1.2 Invalid AI Model Identifier (404 Error)

- **File:** [route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/ai/hltb/route.ts#L98)
- **Impact:** **High (Feature Defect)**
- **Details:** The AI route specifies the model identifier `"gemini-2.5-flash"` inside the fallback array. This model identifier does not exist in the Google Generative Language API (available versions are `gemini-2.0-flash`, `gemini-1.5-flash`, etc.). Under execution, it causes a `404 Not Found` response from the API, causing all HLTB AI search requests to fail and fallback to an error state.
- **Solution:** Change the model string to `"gemini-2.0-flash"`.

### 1.3 State Desync on Review Creation

- **File:** [AddReviewModal.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/reviews/AddReviewModal.tsx#L52)
- **Impact:** **Medium (UX/State Defect)**
- **Details:** Unlike `EditReviewModal.tsx` which calls `window.location.reload()`, `AddReviewModal.tsx` simply toggles `setOpen(false)` upon a successful review creation. The new review is not dynamically injected into the local state, nor is the router refreshed, meaning the user will not see their newly posted review in the list until they manually press F5 to reload the page.
- **Solution:** Call `router.refresh()` from `next/navigation` or refresh via state management.

---

## 🛡️ 2. Security & Authorization Vulnerabilities

### 2.1 API Route Global Authentication Bypass - DONE

- **File:** [auth.config.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/auth.config.ts#L12)
- **Impact:** **High (Security Risk)**
- **Details:** The middleware authorized callback marks all paths starting with `/api` as public routes:
    ```typescript
    const isApiRoute = nextUrl.pathname.startsWith("/api");
    const isPublicRoute = isAuthRoute || isApiRoute || isHomeRoute;
    if (!isPublicRoute) { ... }
    ```
    While some API endpoints manually check authentication, this design pattern defaults to "unsafe". Any new API endpoint added to `src/app/api/` that forgets to manually invoke `auth()` will be completely exposed to the public internet.
- **Solution:** Restrict public route bypasses to specific auth endpoints (e.g. `/api/auth/*`) and secure `/api/*` by default in the middleware.

### 2.2 Unauthenticated IGDB Proxy - DONE

- **File:** [route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/igdb/route.ts#L4)
- **Impact:** **Medium (Abuse/Cost Risk)**
- **Details:** The `/api/igdb` proxy endpoint accepts query parameters and forwards them to the IGDB API. However, it does not perform _any_ session check or rate-limiting. A malicious client could flood this endpoint to deplete API search quotas or compromise Twitch Client credentials.
- **Solution:** Add an authentication gate at the top of the route handler:
    ```typescript
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    ```

### 2.3 Authorization Bypass in Server Actions - DONE

- **File:** [randomizer-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts#L18)
- **Impact:** **High (Authorization Bypass)**
- **Details:** The `saveRandomizerRoll` server action only checks if the user is logged in. It does **not** check if the user is a verified player using the `isRandomizerPlayer` helper (unlike the `saveSelections` action in `pool-actions.ts`):
    ```typescript
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Usuário não autenticado");
    }
    // Missing check for isRandomizerPlayer(session.user.email)
    ```
    This allows any registered member of the community to forge randomizer rolls and insert arbitrary closed pools.
- **Solution:** Add a permission check for `isRandomizerPlayer(session.user.email)` before processing database updates.

### 2.4 Bypasses in API Route `/api/pools` and `/api/games` - DONE

- **Files:** [/api/pools/route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts#L40) and [/api/games/route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/games/route.ts#L36)
- **Impact:** **High (Authorization Bypass & Forgery)**
- **Details:**
    1. The `POST` and `PUT` endpoints in `/api/pools` check for logged-in status but fail to check `isRandomizerPlayer`, allowing unauthorized users to manipulate pools.
    2. The `POST` endpoint in `/api/games` allows the client to pass _any_ arbitrary `nominatedById` string in the request body. It does not validate that `nominatedById` matches `session.user.id`, allowing players to create nominations on behalf of other users.
    3. The `PUT` endpoint in `/api/games` maps `nominatedById` to the database schema update payload, letting a user reassign ownership/nominator rights of a game after creation.
- **Solution:** Always validate user ownership on inputs and assert user scopes on write operations.

---

## ⚡ 3. Performance & Scaling Issues

### 3.1 Potential Cache Serialization Failure in Twitch Token - DONE

- **File:** [igdb.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/igdb.ts#L44)
- **Impact:** **High (Service Downtime)**
- **Details:** `getTwitchToken` caches the authentication token using `unstable_cache`. However, if the inner function `fetchNewTwitchToken()` encounters a network timeout or error, it returns `null` and prints a warning. Next.js will cache this `null` return value for 24 hours (86400s), completely disabling the IGDB search capability for a whole day.
- **Solution:** Do not swallow errors inside functions wrapped with `unstable_cache`. Throwing an exception prevents Next.js from caching the result, ensuring that a retry is attempted on the next request:
    ```typescript
    async function fetchNewTwitchToken(): Promise<string> {
        // If error, throw new Error("...") instead of returning null
    }
    ```

### 3.2 In-Memory Shuffling (N+1 Query & Scale Limit) - DONE

- **File:** [page.tsx](<file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/(main)/page.tsx#L35>)
- **Impact:** **Medium (Database/Memory Load)**
- **Details:** To display 5 random reviews on the dashboard, the application queries all review IDs from the database, shuffles them in JavaScript memory, and then makes another query to fetch the full records for those 5 IDs:
    ```typescript
    prisma.review.findMany({ select: { id: true } }); // Selects thousands of rows in production!
    ```
    This creates an unnecessary bandwidth burden as the volume of reviews increases.
- **Solution:** Execute a raw random selection query directly in Postgres:
    ```typescript
    const randomReviews = await prisma.$queryRaw`
        SELECT r.*, g.title as "game_title", u.name as "user_name" 
        FROM reviews r
        JOIN games g ON r.game_id = g.id
        JOIN users u ON r.user_id = u.id
        ORDER BY RANDOM() LIMIT 5
    `;
    ```

### 3.3 Event Listener Leak in Autocomplete - DONE

- **File:** [game-autocomplete.tsx](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/components/ui/game-autocomplete.tsx#L55)
- **Impact:** **Low (Memory Consumption)**
- **Details:** The click-outside handling hook depends on `onCancel`. If the parent component passes an inline arrow function (e.g. `onCancel={() => setIsSearching(false)}`), the reference changes on every single render. This forces `useEffect` to unbind and rebind the event listener on the `document` repeatedly, adding CPU overhead.
- **Solution:** Memoize the parent callback using `useCallback` or capture `onCancel` in a ref inside `GameAutocomplete`.

---

## 🛠️ 4. Database & Transaction Integrity Gotchas

### 4.1 Progress Data Corruption on Winner Roll - DONE

- **Files:** [pool-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/pool-actions.ts#L305), [randomizer-actions.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/lib/randomizer-actions.ts#L118), and [/api/pools/route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts#L113)
- **Impact:** **High (Data Integrity Loss)**
- **Details:** When a game is drawn as a winner, the transaction calls `updateMany` to mark its status as `ACTIVE` and reset the `start_date` for all users:
    ```typescript
    await tx.gameProgress.updateMany({
        where: { game_id: winnerEntry.game_id },
        data: { status: "ACTIVE", start_date: new Date() },
    });
    ```
    If user A has already completed this game (`COMPLETED`) or dropped it (`DROPPED`) in the past (perhaps from a different year or personal play), this query will overwrite their completion status and force it back to `ACTIVE`, corrupting user data.
- **Solution:** Restrict status changes to users who currently have a `SUGGESTED` status for that game:
    ```typescript
    where: {
        game_id: winnerEntry.game_id,
        status: "SUGGESTED"
    }
    ```

### 4.2 Missing Cascading Deletes (Foreign Key Crashes) - DONE

- **File:** [schema.prisma](file:///c:/Users/mathe/Desktop/gamers-aposentados/prisma/schema.prisma)
- **Impact:** **High (Server Crash on Delete)**
- **Details:** The game endpoint allows users to delete nominations (`DELETE /api/games`). However, the `Review` and `PoolEntry` models do not define cascading deletes on the `game` relationship. If a user deletes a game that has associated reviews or was featured in a pool entry, the database will throw a foreign key constraint violation (`PRISMA_P2003`), crashing the operation.
- **Solution:** Update `prisma/schema.prisma` to cascade deletes for reviews and pool entries:
    ```prisma
    model Review {
       game_id String
       game    Game   @relation(fields: [game_id], references: [id], onDelete: Cascade)
    }
    ```

---

## 🧑‍💻 5. Code Quality & Next.js Anti-patterns

### 5.1 Full Browser Reloads (UX & Performance Defect) - DONE

- **Files:** Multiple React Components
- **Details:** `ActiveQuestHero.tsx`, `SideQuestBar.tsx`, `EditReviewModal.tsx`, and `ReviewCard.tsx` utilize `window.location.reload()` to refresh page data after completing, dropping, or editing reviews/quests.
- **Impact:** This destroys React's virtual DOM state, forces a white flash/flicker, resets scroll positions, and negates the benefits of Next.js client-side navigation.
- **Solution:** Import `useRouter` from `next/navigation` and invoke `router.refresh()` to fetch updated data from the server seamlessly without page reloads.

### 5.2 Dead Code in API Route - DONE

- **File:** [route.ts](file:///c:/Users/mathe/Desktop/gamers-aposentados/src/app/api/pools/route.ts#L122-L125)
- **Details:** The generic update code in `PUT /api/pools` is unreachable:
    ```typescript
    if (action !== "draw") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (action === "draw") { ... }
    // Below code is unreachable because action is guaranteed to be "draw" at this point
    const data = mapPoolInput(body);
    const updated = await prisma.pool.update({ where: { id }, data });
    ```
- **Solution:** Remove the dead code.

---

## 📋 6. Actionable Recommendations Summary

| Issue Area         | File / Location                | Severity    | Recommended Code Fix                                                                                                               |
| :----------------- | :----------------------------- | :---------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **React/Purity**   | `src/app/(main)/page.tsx`      | 🚨 Critical | Shuffling logic should be isolated outside render, or query using `$queryRaw` to select 5 random reviews.                          |
| **AI Integration** | `src/app/api/ai/hltb/route.ts` | 🟡 High     | Update the fallback model list to contain `"gemini-2.0-flash"` instead of `"gemini-2.5-flash"`.                                    |
| **Data Integrity** | `src/app/lib/pool-actions.ts`  | 🟡 High     | Adjust `updateMany` for active games to target only users in the `SUGGESTED` state to prevent progress corruption.                 |
| **Security**       | `src/auth.config.ts`           | 🟡 High     | Exclude API routes from global middleware bypasses. Restrict anonymous access.                                                     |
| **UX & Perf**      | Multiple Components            | 🟢 Medium   | Replace `window.location.reload()` with `router.refresh()` to leverage Next.js router transitions.                                 |
| **DB Validation**  | `src/app/api/games/route.ts`   | 🟡 High     | Add validations verifying that `nominatedById` matches the authenticated `session.user.id`. Block body modifications to owner IDs. |
| **Type Safety**    | Various Files                  | 🟢 Low      | Replace `any` variables with appropriate interface typing or utility types.                                                        |

---

_Report compiled on: 2026-05-29_
