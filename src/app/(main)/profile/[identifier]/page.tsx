import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Trophy, Gamepad2, Star, Calendar } from "lucide-react";
import Image from "next/image";
import { FavoriteGamesModule } from "@/components/profile/favorite-games-module";
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { setFavoriteGames, setFavoriteGamesOfYear } from "@/app/lib/user-actions";

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
            OR: [{ id: identifier }, { username: identifier }],
        },
        include: {
            favoriteGames: true,
            favoriteGamesYear: true,
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
        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-10 px-6 py-8 md:px-8 lg:px-12">
            {/* Header */}
            <div className="relative flex min-h-[220px] flex-col items-center justify-center gap-6 overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-950/80 p-8 shadow-2xl md:flex-row md:items-center md:justify-start">
                {/* SVG Noise Overlay */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                ></div>
                {/* Neon Glow */}
                <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#bd0df2]/15 blur-[120px]"></div>
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#bd0df2]/10 blur-[100px]"></div>

                <div className="relative z-10 flex shrink-0 drop-shadow-[0_0_15px_rgba(189,13,242,0.3)]">
                    <AvatarUpload
                        currentImage={user.image || null}
                        name={user.name || null}
                        isOwner={isOwner}
                        className="h-32 w-32 md:h-40 md:w-40"
                    />
                </div>

                <div className="z-10 flex flex-1 flex-col items-center gap-3 text-center md:items-start md:text-left">
                    <h1 className="text-shadow-glow text-4xl font-black tracking-tighter text-white drop-shadow-md md:text-5xl lg:text-6xl">
                        {user.name || "Gamer"}
                    </h1>
                    <p className="font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.4)]">
                        @{user.username || "user"}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-4 md:justify-start">
                        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-zinc-900/60 px-5 py-2.5 backdrop-blur-md transition-colors hover:border-[#bd0df2]/30">
                            <Trophy className="h-5 w-5 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                            <span className="text-lg font-black text-white">
                                {completedGamesCount}
                                <span className="ml-2 text-sm font-bold tracking-widest text-[#bd0df2]/60 uppercase">
                                    Completed
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column (Favorites & Stats) */}
                <div className="flex flex-col gap-8 lg:col-span-1">
                    <FavoriteGamesModule
                        title="Top 3 Games (All Time)"
                        initialFavorites={user.favoriteGames}
                        isOwner={isOwner}
                        onSaveAction={setFavoriteGames}
                    />

                    <FavoriteGamesModule
                        title={`Top 3 Games of ${new Date().getFullYear()}`}
                        initialFavorites={user.favoriteGamesYear}
                        isOwner={isOwner}
                        onSaveAction={setFavoriteGamesOfYear}
                    />

                    <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-md transition-colors hover:border-white/10">
                        <h2 className="mb-6 flex items-center gap-2 text-sm font-black tracking-widest text-[#bd0df2] uppercase drop-shadow-[0_0_8px_rgba(189,13,242,0.3)]">
                            <Gamepad2 className="h-4 w-4 fill-[#bd0df2]/20" />
                            Gamer Stats
                        </h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950/50 p-4 shadow-inner transition-colors hover:border-[#bd0df2]/30">
                                <span className="text-xs font-black tracking-widest text-zinc-500 uppercase">
                                    Total Completed
                                </span>
                                <span className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                                    {completedGamesCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Recent Reviews) */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    <h2 className="flex items-center gap-2 text-xl font-black tracking-tighter text-white uppercase drop-shadow-md lg:text-2xl">
                        <Star className="h-6 w-6 text-[#bd0df2] drop-shadow-[0_0_8px_rgba(189,13,242,0.5)]" />
                        Recent Reviews
                    </h2>
                    <Separator className="bg-white/10" />

                    <div className="flex flex-col gap-4">
                        {recentReviews.length === 0 ? (
                            <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/5 bg-zinc-950/30 py-16">
                                <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">
                                    No reviews written yet.
                                </span>
                            </div>
                        ) : (
                            recentReviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="group flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-2xl backdrop-blur-md transition-colors hover:border-[#bd0df2]/30"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-md">
                                                {review.game.cover_url ? (
                                                    <Image
                                                        src={review.game.cover_url.replace(
                                                            "t_cover_big",
                                                            "t_1080p",
                                                        )}
                                                        alt={review.game.title}
                                                        fill
                                                        unoptimized
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center p-2 opacity-30">
                                                        <Gamepad2 className="h-8 w-8 text-[#bd0df2]" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col py-1">
                                                <h3 className="line-clamp-2 text-lg font-black tracking-tighter text-white md:text-xl lg:text-2xl">
                                                    {review.game.title}
                                                </h3>
                                                <p className="mt-1 flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#bd0df2]/60 uppercase">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(
                                                        review.created_at,
                                                    ).toLocaleDateString()}
                                                </p>
                                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                                    <div className="flex items-center">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`h-4 w-4 ${i < review.rating / 2 ? "fill-[#bd0df2] text-[#bd0df2] drop-shadow-[0_0_5px_rgba(189,13,242,0.8)]" : "text-white/10"}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-1 rounded-md border border-[#bd0df2]/30 bg-[#bd0df2]/10 px-2 py-0.5 text-xs font-black text-[#bd0df2]">
                                                        SCORE {review.rating}/10
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {review.review_text && (
                                        <div className="relative mt-2 overflow-hidden rounded-xl border border-white/5 bg-zinc-950/60 p-5">
                                            <div className="absolute top-0 left-0 h-full w-1 bg-[#bd0df2]/50"></div>
                                            <p className="text-sm leading-relaxed font-medium text-zinc-300 italic">
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
