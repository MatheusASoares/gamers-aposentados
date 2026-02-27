import { getGamesForReview, getReviews } from "@/app/lib/data";
import { ReviewsClient } from "@/components/reviews/ReviewsClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

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

    return <ReviewsClient reviews={reviews} games={games} currentUserId={session.user.id} />;
}
