import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    // Redirect to the dynamic user profile route using username if available, else id
    const identifier = session.user.username || session.user.id;
    redirect(`/profile/${identifier}`);
}
