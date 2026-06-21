import { NextResponse } from "next/server";
import { searchGamesIGDB } from "@/app/lib/igdb";
import { auth } from "@/auth";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        if (!body.query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const data = await searchGamesIGDB(body.query);
        return NextResponse.json(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        console.error("IGDB API Route Error:", err.message || err);
        return NextResponse.json(
            { error: "Internal Server Error", details: err.message },
            { status: 500 },
        );
    }
}
