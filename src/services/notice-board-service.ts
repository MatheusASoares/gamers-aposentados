import { ai } from "@/lib/gemini";

export interface GeneratedContract {
    sequence_order: number;
    title: string;
    objective: string;
    progress_percentage: number;
}

const contractSchema = {
    type: "ARRAY" as const,
    description: "Lista de contratos sequenciais da campanha do jogo",
    items: {
        type: "OBJECT" as const,
        properties: {
            sequence_order: {
                type: "INTEGER" as const,
                description: "A ordem do contrato na progressão linear, iniciando obrigatoriamente em 1.",
            },
            title: {
                type: "STRING" as const,
                description: "Título conciso do contrato em português do Brasil (ex: 'Chegar em Velen', 'O Fim de Midgar').",
            },
            objective: {
                type: "STRING" as const,
                description: "Objetivo baseado na lore real e na história principal do jogo (ex: 'Completar o Ato 1 e derrotar o chefe nominal X').",
            },
            progress_percentage: {
                type: "INTEGER" as const,
                description: "A porcentagem cumulativa do progresso total do jogo alcançada ao finalizar este contrato. O último contrato deve ser exatamente 100.",
            },
        },
        required: ["sequence_order", "title", "objective", "progress_percentage"],
    },
};

export async function generateContractsForGame(game: {
    title: string;
    quest_type: string;
    platform?: string | null;
    hltb_time?: number | null;
}): Promise<GeneratedContract[]> {
    const { title, quest_type, platform, hltb_time } = game;

    const systemInstruction = 
        `Você é um especialista em design de jogos e progressão de campanhas. ` +
        `Seu objetivo é analisar o jogo fornecido e criar uma trilha linear de marcos reais baseados estritamente na lore, ` +
        `atos, capítulos e chefes reais do jogo. Evite tarefas genéricas como 'consiga 10 itens' ou 'jogue por 2 horas'. ` +
        `Divida a campanha em marcos de história sequenciais apropriados para a duração do jogo (hltb_time). ` +
        `Escreva tudo em português do Brasil, mas mantendo termos consagrados dos jogos se for o caso. ` +
        `Garanta que a porcentagem de progresso seja cumulativa, comece baixa no sequence_order 1 e termine em exatamente 100 no último contrato.`;

    const prompt = 
        `Gere o Notice Board (Quadro de Avisos) sequencial para o seguinte jogo:\n` +
        `- Título: ${title}\n` +
        `- Tipo de Campanha: ${quest_type} (${quest_type === "MAIN_QUEST" ? "História Principal" : "Campanha Secundária/Side Content"})\n` +
        `- Plataforma de Referência: ${platform || "Qualquer"}\n` +
        `- Tempo estimado HLTB (How Long to Beat): ${hltb_time ? `${hltb_time} horas` : "Desconhecido"}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: contractSchema,
                temperature: 0.2,
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error("Resposta vazia retornada do Gemini.");
        }

        const contracts: GeneratedContract[] = JSON.parse(text);

        // Validar e ordenar por sequence_order
        contracts.sort((a, b) => a.sequence_order - b.sequence_order);

        if (contracts.length === 0) {
            throw new Error("Nenhum contrato foi retornado pela IA.");
        }

        // Garantir consistência nas porcentagens e no último elemento
        const lastContract = contracts[contracts.length - 1];
        if (lastContract.progress_percentage !== 100) {
            lastContract.progress_percentage = 100;
        }

        return contracts;
    } catch (error) {
        console.error(`Erro ao gerar contratos para o jogo ${title}:`, error);
        throw error;
    }
}
