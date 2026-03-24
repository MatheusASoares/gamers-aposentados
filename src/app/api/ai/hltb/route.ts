import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate request body
    try {
        const body = await request.json();
        const { titles } = body;

        if (!titles || !Array.isArray(titles) || titles.length === 0) {
            return NextResponse.json(
                { error: "'titles' array is required in the request body" },
                { status: 400 }
            );
        }

        if (titles.length > 6) {
             return NextResponse.json(
                { error: "Maximum of 6 titles are allowed per request" },
                { status: 400 }
            );
        }

        // 3. Check Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not configured.");
            return NextResponse.json(
                { error: "AI service is not configured" },
                { status: 500 }
            );
        }

        // 4. Query DB for existing HLTB times
        const existingGames = await prisma.game.findMany({
            where: {
                title: { in: titles }
            },
            select: { title: true, hltb_time: true }
        });

        const results: { title: string; mainStory: number | null }[] = [];
        const titlesToFetch: string[] = [];

        for (const title of titles) {
            const gameInDb = existingGames.find(g => g.title.toLowerCase() === title.toLowerCase());
            if (gameInDb && gameInDb.hltb_time !== null) {
                // Game already has time in DB, use it directly
                results.push({ title, mainStory: gameInDb.hltb_time });
            } else {
                titlesToFetch.push(title);
            }
        }

        // If all are already in DB, return immediately
        if (titlesToFetch.length === 0) {
            console.log(`[API /ai/hltb] Substituted all ${titles.length} games from DB cache.`);
            return NextResponse.json({ results });
        }

        // 5. Construct prompt only for games we need
        const promptText = `
You are a helpful AI assistant specialized in video games.
I need you to find the estimated completion times for the following video games using HowLongToBeat (HLTB) data.

Here are the games I need data for:
${titlesToFetch.map(t => `- ${t}`).join('\n')}

For each game, extract the estimated hours for:
1. mainStory (Main Story)

Return a strictly valid JSON object adhering to this schema:
{
  "results": [
    {
      "title": "Game Name",
      "mainStory": number | null
    }
  ]
}

Only include the integer number of hours. If a time is listed as "5½ Hours" or "5.5 Hours", round up to the nearest integer (ex: 6). If it's less than 1 hour, return 1. If missing, return null. 
Ensure the 'title' matches the input title as closely as possible.
Return strictly the JSON, nothing else. No markdown syntax.
        `;

        // 6. Execute via Native Fetch with Fallback Logic
        const models = [
            "gemini-2.0-flash",           // Model principal (v2.0 Flash)
            "gemini-2.5-flash",           // Test-out model (v2.5 Flash)
            "gemini-2.5-pro",            // Test-out model (v2.5 Pro)
            "gemini-2-flash-lite"        // Backup lightweight
        ];

        let finalResponse = null;
        let lastError = null;
        let usedModel = "";

        for (const model of models) {
            console.log(`[API /ai/hltb] Trying model ${model} for ${titlesToFetch.length} games...`);
            
            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                
                const response = await fetch(geminiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: promptText }]
                        }],
                        generationConfig: {
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (response.ok) {
                    finalResponse = await response.json();
                    usedModel = model;
                    break;
                } else {
                    const errorText = await response.text();
                    lastError = { status: response.status, text: errorText };
                    console.warn(`[API /ai/hltb] Model ${model} failed with ${response.status}: ${errorText}`);
                    
                    // If it's NOT a rate limit (429), we might want to stop early, 
                    // but for safety, if it's 400 or 500, we try the next one anyway.
                    if (response.status !== 429) {
                        // Optional: break if it's a permanent error (like 400 bad request)
                    }
                }
            } catch (err: any) {
                console.error(`[API /ai/hltb] Fetch error with ${model}:`, err.message);
                lastError = err;
            }
        }

        if (!finalResponse) {
            console.error("[API /ai/hltb] All models failed.", lastError);
            const status = lastError?.status || 500;
            return NextResponse.json(
                { error: "All AI models reached their quota or failed. Try again later.", details: lastError?.text },
                { status }
            );
        }

        console.log(`[API /ai/hltb] Success using ${usedModel}`);
        const text = finalResponse.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
             throw new Error("Invalid response format from Gemini");
        }

        // 7. Parse and return results
        try {
            const parsedData = JSON.parse(text);
            
            // Add new fetched data to results and save to DB
            if (parsedData && Array.isArray(parsedData.results)) {
                for (const aiResult of parsedData.results) {
                    if (aiResult.title && aiResult.mainStory !== undefined) {
                        // Push to the API response array
                        results.push({ title: aiResult.title, mainStory: aiResult.mainStory });
                        
                        // Async update DB
                        if (aiResult.mainStory !== null) {
                            try {
                                await prisma.game.updateMany({
                                    where: { 
                                        title: { 
                                            equals: aiResult.title,
                                            mode: 'insensitive' 
                                        } 
                                    },
                                    data: { hltb_time: aiResult.mainStory }
                                });
                            } catch (dbError) {
                                console.error("[API /ai/hltb] Error updating DB for", aiResult.title, dbError);
                            }
                        }
                    }
                }
            }

            return NextResponse.json({ results });
        } catch (parseError) {
             console.error("[API /ai/hltb] Failed to parse JSON:", text, parseError);
             return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("[API /ai/hltb] Internal error:", error);
         return NextResponse.json(
             { error: "Internal server error connecting to AI service", details: error?.message },
             { status: 500 }
         );
    }
}
