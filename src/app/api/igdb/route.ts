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
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("IGDB API Route Error:", errorMessage);
        return NextResponse.json(
            { error: "Internal Server Error", details: errorMessage },
            { status: 500 },
        );
    }
}
