import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Gamepad2, Star, Calendar } from "lucide-react";
import { FavoriteGamesModule } from "@/components/profile/favorite-games-module";
import { Separator } from "@/components/ui/separator";

// Em Next.js App Router (15+), `params` em Server Components costuma precisar de await ou desestruturação async
// Como estamos usando RSC padrão, `params` é uma Promise.
interface ProfilePageProps {
    params: Promise<{ identifier: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const session = await auth();
    const { identifier } = await params;

    if (!session?.user?.id) {
        redirect("/login");
    }

    const currentUserId = session.user.id;

    // Fetch user with favorite games
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { id: identifier },
                { username: identifier }
            ]
        },
        include: {
            favoriteGames: true,
        },
    });

    if (!user) {
        notFound();
    }

    const isOwner = currentUserId === user.id;

    // Fetch stats
    const completedGamesCount = await prisma.gameProgress.count({
        where: { user_id: user.id, status: "COMPLETED" },
    });

    // Fetch recent reviews
    const recentReviews = await prisma.review.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: "desc" },
        take: 3,
        include: { game: true },
    });

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 py-8">
            {/* Header */}
            <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-8 md:flex-row md:items-start">
                <div className="bg-primary/10 pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full blur-[100px]"></div>

                <Avatar className="h-32 w-32 border-4 border-zinc-900 shadow-xl">
                    <AvatarImage
                        src={user.image || ""}
                        alt={user.name || "User"}
                        className="object-cover"
                    />
                    <AvatarFallback className="bg-zinc-800 text-4xl text-zinc-400">
                        {user.name?.charAt(0) || "G"}
                    </AvatarFallback>
                </Avatar>

                <div className="z-10 flex flex-1 flex-col items-center gap-2 md:items-start">
                    <h1 className="text-4xl font-black text-white">{user.name || "Gamer"}</h1>
                    <p className="text-primary font-medium">@{user.username || "user"}</p>
                    <div className="mt-2 flex gap-4">
                        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 px-4 py-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-white">
                                {completedGamesCount}{" "}
                                <span className="font-normal text-zinc-500">Completed</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column (Favorites & Stats) */}
                <div className="flex flex-col gap-8 lg:col-span-1">
                    <FavoriteGamesModule initialFavorites={user.favoriteGames} isOwner={isOwner} />

                    <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-6">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                            <Gamepad2 className="text-primary h-5 w-5" />
                            Gamer Stats
                        </h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950 p-4">
                                <span className="text-zinc-400">Total Completed</span>
                                <span className="text-xl font-bold text-white">
                                    {completedGamesCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Recent Reviews) */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <h2 className="flex items-center gap-2 text-2xl font-black text-white">
                        <Star className="text-primary h-6 w-6" />
                        Recent Reviews
                    </h2>
                    <Separator className="bg-white/5" />

                    <div className="flex flex-col gap-4">
                        {recentReviews.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/20 p-10 text-center">
                                <p className="text-zinc-500">No reviews written yet.</p>
                            </div>
                        ) : (
                            recentReviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-colors hover:border-white/10"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            {review.game.cover_url ? (
                                                <img
                                                    src={review.game.cover_url}
                                                    alt={review.game.title}
                                                    className="h-24 w-16 rounded-lg border border-white/10 object-cover shadow-md"
                                                />
                                            ) : (
                                                <div className="flex h-24 w-16 items-center justify-center rounded-lg border border-white/10 bg-zinc-800">
                                                    <Gamepad2 className="h-6 w-6 text-zinc-600" />
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-bold text-white">
                                                    {review.game.title}
                                                </h3>
                                                <p className="flex items-center gap-1 text-sm text-zinc-500">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(
                                                        review.created_at,
                                                    ).toLocaleDateString()}
                                                </p>
                                                <div className="mt-2 flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${i < review.rating / 2 ? "fill-yellow-500 text-yellow-500" : "text-zinc-700"}`}
                                                        />
                                                    ))}
                                                    <span className="ml-2 text-sm text-zinc-400">
                                                        {review.rating}/10
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {review.review_text && (
                                        <div className="rounded-xl bg-zinc-950 p-4">
                                            <p className="line-clamp-3 text-sm text-zinc-300 italic">
                                                "{review.review_text}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
