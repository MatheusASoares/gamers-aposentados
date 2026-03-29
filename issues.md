1. CRITICAL BUGS/ERRORS
   1.1 Race Condition in Pool Entry Deletion
   File: src/app/lib/pool-actions.ts (lines 124-130)

// 2. Remove existing entries from THIS user in THIS pool
await tx.poolEntry.deleteMany({
where: {
pool_id: pool.id,
user_id: userId,
},
});
Issue: Between finding the pool and deleting entries, another request could modify the pool. Use SELECT FOR UPDATE or a more robust transaction isolation level.

1.2 Timer Race Condition in RandomizerClient
File: src/components/game/RandomizerClient.tsx (lines 274-286)

if (cycleInterval!) clearInterval(cycleInterval); // BUG: cycleInterval could be undefined
Issue: The cycleInterval might be undefined if allCandidates.length is 0, causing a runtime error when trying to clear it.

1.3 Missing Input Validation for Rating
File: src/components/reviews/AddReviewModal.tsx (lines 117-126)

<input
type="number"
min="0"
max="10"
step="1"
value={rating}
onChange={(e) => setRating(e.target.value)}
required
/>
Issue: Client-side validation only. A malicious user can send arbitrary values. Should validate server-side in createReview() action.

1.4 No User Ownership Validation in API Routes
File: src/app/api/games/route.ts (lines 36-58, 61-80, 83-100)

export async function PUT(request: Request) {
const session = await auth();
if (!session?.user?.id) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// No check if user owns the game being updated!
const updated = await prisma.game.update({ where: { id }, data });
}
Issue: Any authenticated user can update/delete ANY game in the database.

1.5 Non-Atomic Pool Deletion
File: src/app/api/pools/route.ts (lines 128-147)

export async function DELETE(request: Request) {
// ...
await prisma.poolEntry.deleteMany({ where: { pool_id: id } });
await prisma.pool.delete({ where: { id } });
// If second query fails, entries are orphaned
}
Issue: Should use a transaction to ensure atomic deletion.

2. SECURITY ISSUES
   2.1 SQL Injection via IGDB Search
   File: src/app/lib/igdb.ts (line 77)

body: `search "${query}"; fields name, cover.image_id...`,
Issue: While IGDB API should handle this, direct string interpolation is risky. Use parameterized queries if available.

2.2 No Rate Limiting on API Routes
File: src/app/api/igdb/route.ts, src/app/api/ai/hltb/route.ts Issue: No rate limiting on expensive operations like IGDB searches and AI calls. Can lead to abuse/costs.

2.3 API Key Exposure Risk
File: src/app/api/ai/hltb/route.ts (line 31)

const apiKey = process.env.GEMINI_API_KEY;
Issue: If the API route has any error, the API key could be logged. Consider using server-side only logging.

2.4 Hardcoded Randomizer Players
File: src/lib/randomizer-players.ts (lines 8-9)

export const RANDOMIZER_PLAYER_EMAILS = ["matheus31also@gmail.com", "lucasedu17gomes@gmail.com"];
Issue: Email addresses are hardcoded. If compromised, hardcoded values are hard to rotate. Consider database-driven configuration.

2.5 Missing CSRF Protection Consideration
Files: Server actions in src/app/lib/ Issue: While Next.js Server Actions have built-in CSRF protection, ensure all mutations go through actions, not exposed API routes that bypass CSRF tokens.

2.6 No Ownership Validation in Progress Actions
File: src/app/lib/progress-actions.ts (lines 7-53)

// User ID is validated but game ownership is not checked
const existingProgress = await prisma.gameProgress.findUnique({
where: { id: progressId },
});
// Only checks user_id matches, not if game belongs to user's quests 3. PERFORMANCE PROBLEMS
3.1 N+1 Query in setFavoriteGamesBase
File: src/app/lib/user-actions.ts (lines 109-140)

for (const candidate of candidates) {
let game = await prisma.game.findFirst({...});
if (!game) {
game = await prisma.game.create({...});
}
// ...
gameIds.push({ id: game.id });
}
Issue: Sequential queries for each game. With 3 games, this is 3-6 queries. Should use Promise.all() or batch operations.

3.2 N+1 Query in Randomizer Roll
File: src/app/lib/randomizer-actions.ts (lines 37-83)

const savedGames = await Promise.all(
candidates.map(async (candidate) => {
const existingGame = await tx.game.findFirst({...});
// ...
}),
);
Issue: While Promise.all() is used, each iteration still makes 1-2 database calls. Consider batch find operation.

3.3 Missing Database Index on Frequently Queried Fields
File: prisma/schema.prisma

model PoolEntry {
pool_id String
user_id String
game_id String
// Missing composite index for (pool_id, user_id)
}
Issue: The unique constraint on PoolEntry should have an explicit index. Also missing index on GameProgress.game_id for the updateMany operations.

3.4 No Pagination on List Endpoints
File: src/app/api/games/route.ts (line 28)

const games = await prisma.game.findMany({ orderBy: { created_at: "desc" } });
Issue: Returns ALL games with no pagination. Will degrade as database grows.

3.5 Redundant Image URL Processing
Files: Multiple components (RandomizerClient.tsx, ReviewCard.tsx, etc.)

const cinematicImg = result.winnerImageUrl?.replace("t_cover_big", "t_1080p")
Issue: Same URL manipulation repeated in multiple places. Create a utility function.

3.6 Expensive Unstable Cache Usage
File: src/app/lib/igdb.ts (lines 44-52)

export const getTwitchToken = unstable_cache(
async () => { return fetchNewTwitchToken(); },
["igdb-twitch-token"],
{ revalidate: 86400 }
);
Issue: Token is cached for 24 hours but fetchNewTwitchToken is async. Concurrent requests might race and create multiple tokens.

4. CODE QUALITY ISSUES
   4.1 TypeScript any Types
   File: src/app/lib/progress-actions.ts (line 30)

const dataToUpdate: any = { progress_percentage: percentage };
File: src/components/reviews/ReviewsClient.tsx (lines 9-12)

reviews: any[]; // Adjust type based on Prisma include
games: any[];
File: src/components/auth/settings-modal.tsx (lines 23-24)

user: any;
4.2 Missing useEffect Dependencies
File: src/components/game/RandomizerClient.tsx (lines 141-161)

useEffect(() => {
// ...
}, [
questType,
loadPool,
// Missing: poolIsComplete, isRolling, hasUnsavedChanges, addingGame, isSaving, winner
// These are used inside but not in deps array
]);
Issue: ESLint should catch this, but the // eslint-disable comments may suppress warnings.

4.3 Duplicate Function Definitions
Files: src/app/lib/quest-actions.ts and src/app/lib/progress-actions.ts

// Both files export: completeQuest, dropQuest
Issue: Confusing codebase. quest-actions.ts exports by gameId, progress-actions.ts exports by progressId. Pick one pattern.

4.4 Inconsistent Error Handling Patterns
File: src/app/lib/randomizer-actions.ts (lines 151-156)

} catch (error: any) {
console.error("Erro ao salvar Randomizer DB:", error);
return { success: false, error: "Erro interno: " + (error?.message || "Desconhecido") };
}
Issue: Mixing languages (Portuguese error messages in English code). Inconsistent across files.

4.5 Magic Numbers Without Constants
File: src/app/lib/pool-actions.ts (line 245)

const totalRequired = maxPerPerson \* 2;
Issue: Magic number 2 represents minimum players. Should be a named constant.

4.6 Console.log in Production
File: src/app/api/upload/route.ts (line 40)

console.log("[/api/upload] Success, blob URL:", blob.url);
Issue: Production logging should use proper logging infrastructure (winston, pino, etc.).

4.7 Duplicate Code in Dashboard Components
Files: ActiveQuestHero.tsx and SideQuestBar.tsx

~300 lines of nearly identical code
Same progress tracking UI, same action handlers
Recommendation: Extract shared logic into a custom hook useQuestProgress(gameId).

4.8 Commented Code
File: src/app/lib/actions.ts (line 10)

// const prisma = new PrismaClient(); // Removed
Issue: Remove commented code instead of leaving it in production.

5. DATABASE SCHEMA ISSUES
   5.1 Missing Unique Constraint on Game.igdb_id
   File: prisma/schema.prisma (lines 88-89)

igdb_id String? @unique
Issue: igdb_id is optional but unique when present. However, there might be multiple games with igdb_id = null from different users. Consider partial unique index.

5.2 Missing Unique Constraint on Game.title
File: prisma/schema.prisma (line 90)

title String // No @unique
Issue: Multiple games can have the same title, causing confusion in game lookups by title.

5.3 Cascade Delete Risk
File: prisma/schema.prisma (lines 123, 126)

user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
game Game @relation(fields: [game_id], references: [id], onDelete: Cascade)
Issue: Deleting a user or game cascades to GameProgress, potentially losing valuable historical data. Consider soft deletes.

5.4 Missing Validation on Review.rating
File: prisma/schema.prisma (line 145)

rating Int // 0 a 10 ou 0 a 5
Issue: No database-level CHECK constraint to enforce 0-10 range.

6. ACCESSIBILITY ISSUES
   6.1 Missing ARIA Labels on Range Input
   File: src/components/dashboard/SideQuestBar.tsx (lines 274-281)

<input
type="range"
min="0"
max="100"
value={percentage}
onChange={(e) => setPercentage(Number(e.target.value))}
className="..." // No aria-label or aria-valuenow
/>
6.2 Incomplete Form Labels
File: src/components/reviews/AddReviewModal.tsx (lines 158-168)

<textarea
rows={4}
placeholder="Descreva sua experiência com o jogo..."
// Missing id and aria-describedby

> </textarea>
> 6.3 Color Contrast in Error States
> File: src/components/auth/login-form.tsx (line 120)

{errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
// Red on dark background may not meet WCAG AA contrast 7. RECOMMENDATIONS WITH CODE EXAMPLES
7.1 Fix Race Condition in Pool Entry Deletion
// Use serializable transaction isolation
const result = await prisma.$transaction(async (tx) => {
// Use raw query with FOR UPDATE, or
// Check pool status inside transaction
const pool = await tx.pool.findUnique({
where: { id: poolId },
select: { status: true }
});

    if (pool?.status === "CLOSED") {
        throw new Error("Pool is closed, cannot modify entries");
    }

    await tx.poolEntry.deleteMany({
        where: { pool_id: poolId, user_id: userId },
    });

}, {
isolationLevel: 'Serializable'
});
7.2 Add Validation to Review Rating
// In review-actions.ts
export async function createReview(params: CreateReviewParams) {
const { gameId, rating, difficulty, hoursPlayed, reviewText } = params;

    // Validate rating range
    if (rating < 0 || rating > 10) {
        return { success: false, error: "Rating must be between 0 and 10" };
    }

    if (difficulty !== undefined && (difficulty < 1 || difficulty > 5)) {
        return { success: false, error: "Difficulty must be between 1 and 5" };
    }

    // ... rest of function

}
7.3 Create Shared Utility for Image URLs
// src/lib/images.ts
export function getHighResImageUrl(url: string | null | undefined, quality: '720p' | '1080p' | 'cover_big' = '1080p'): string | null {
if (!url) return null;

    const qualityMap = {
        '720p': 't_720p',
        '1080p': 't_1080p',
        'cover_big': 't_cover_big'
    };

    return url.replace(/t_\w+/, qualityMap[quality]);

}

// Usage
const cinematicImg = getHighResImageUrl(winnerImageUrl, '1080p');
7.4 Extract Shared Quest Progress Hook
// src/hooks/useQuestProgress.ts
export function useQuestProgress(gameId: string) {
const [isUpdating, setIsUpdating] = useState(false);
const [percentage, setPercentage] = useState(0);
const [isLoading, setIsLoading] = useState(false);

    const updateProgress = async (newPercentage: number) => {
        setIsLoading(true);
        const res = await updateQuestProgress(gameId, newPercentage);
        setIsLoading(false);
        return res;
    };

    const complete = async () => {
        setIsLoading(true);
        const res = await completeQuest(gameId);
        setIsLoading(false);
        return res;
    };

    const drop = async () => {
        setIsLoading(true);
        const res = await dropQuest(gameId);
        setIsLoading(false);
        return res;
    };

    return { isUpdating, setIsUpdating, percentage, setPercentage, isLoading, updateProgress, complete, drop };

}
7.5 Add Pagination to Games Endpoint
// src/app/api/games/route.ts
export async function GET(request: Request) {
const { searchParams } = new URL(request.url);
const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
const skip = (page - 1) \* limit;

    const [games, total] = await prisma.$transaction([
        prisma.game.findMany({
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
        }),
        prisma.game.count(),
    ]);

    return NextResponse.json({
        data: games,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    });

}
7.6 Add Rate Limiting to API Routes
// src/middleware.ts or per-route
import { ratelimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
const { success, remaining, reset } = await ratelimit.limit(identifier);

    if (!success) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please wait.", reset },
            { status: 429 }
        );
    }
    // ... rest of handler

}
7.7 Add Proper Type for Prisma Includes
// src/types/database.ts
import { Prisma } from '@prisma/client';

export type ReviewWithRelations = Prisma.ReviewGetPayload<{
include: {
user: { select: { name: true; username: true; image: true } };
game: { select: { title: true; cover_url: true; platform: true; quest_type: true } };
};
}>;

// Usage in component
interface ReviewsClientProps {
reviews: ReviewWithRelations[];
}

SUMMARY
Category Count
Critical Bugs 5
Security Issues 6
Performance Problems 6
Code Quality Issues 8
Database Schema Issues 4
Accessibility Issues 3
Total Issues 32
