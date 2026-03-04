import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function UserMenu() {
    const session = await auth();

    if (!session?.user) {
        return (
            <div className="flex gap-4">
                <Link href="/login">
                    <Button variant="outline">Login</Button>
                </Link>
                <Link href="/register">
                    <Button>Sign Up</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
                Signed in as {session.user.email} ({(session.user as any).username || "User"})
            </span>
            <form
                action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                }}
            >
                <Button variant="outline">Sign Out</Button>
            </form>
        </div>
    );
}
