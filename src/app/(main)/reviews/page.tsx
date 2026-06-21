import { getGamesForReview, getReviews } from "@/app/lib/data";
import { ReviewsClient } from "@/components/reviews/ReviewsClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = {
    title: "Game Reviews | Gamers Aposentados",
    description: "Honest takes from the retired vanguard of the golden era.",
};

export default async function ReviewsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const reviews = await getReviews();
    const games = await getGamesForReview();

    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400 font-bold uppercase tracking-wider">
                Carregando Reviews...
            </div>
        }>
            <ReviewsClient reviews={reviews} games={games} currentUserId={session.user.id} />
        </Suspense>
    );
}
