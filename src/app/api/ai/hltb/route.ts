import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

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
You are a specialized gaming expert with access to real-time search. 
CRITICAL: You MUST search the internet/HowLongToBeat website to find the LATEST estimated completion times for the following video games. Do not rely solely on your training data if a search can provide more accurate/fresh numbers.

Games to research:
${titlesToFetch.map(t => `- ${t}`).join('\n')}

For each game, find the "Main Story" (or "Polled") average time.
Return a strictly valid JSON object:
{
  "results": [
    {
      "title": "Exact Title Provided",
      "mainStory": number | null
    }
  ]
}

Rules:
- Round up half-hours (e.g. 5.5h -> 6h).
- Use 1 for any game < 1h.
- Return null only if the game absolutely cannot be found.
- Return ONLY the JSON object.
        `;

        // 6. Execute via Native Fetch
        const models = [
            "gemini-2.5-flash",          // Único modelo permitido no plano free para não esgotar 15 RPM
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
                    signal: AbortSignal.timeout(14000), // Timeout de 14s por modelo
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: promptText }]
                        }],
                        // Ativando Grounding de Busca corretamente para os modelos novos (2.0+)
                        tools: [{ googleSearch: {} }]
                        // NOTA: O 'responseMimeType: "application/json"' foi removido pois 
                        // é incompatível com ferramentas de busca ativadas na v1beta.
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
                    
                    // MITIGAÇÃO DE VAZAMENTO DE RATE LIMIT: 
                    // Se a cota RPM ou Diária acabou, pare IMEDIATAMENTE.
                    if (response.status === 429) {
                        console.error("[API /ai/hltb] Rate Limit exaurido (429). Interrompendo fallback.");
                        break;
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
                { error: "Falha na comunicação com a IA ou limite excedido. Tente novamente mais tarde.", details: lastError?.message || lastError?.text || "Unknown error" },
                { status: status === 429 ? 429 : (status >= 400 && status < 600 ? status : 500) }
            );
        }

        console.log(`[API /ai/hltb] Success using ${usedModel}`);
        const rawText = finalResponse.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!rawText) {
             console.error("[API /ai/hltb] Blank or Blocked Response:", finalResponse);
             return NextResponse.json({ error: "O modelo da IA se recusou a responder ou bloqueou a resposta." }, { status: 500 });
        }

        // Limpa possíveis marcações markdown geradas pelo LLM (já que não estamos em "strict json mode")
        const cleanJsonText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

        // 7. Parse and return results
        try {
            const parsedData = JSON.parse(cleanJsonText);
            
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
             console.error("[API /ai/hltb] Failed to parse JSON:", rawText, parseError);
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
