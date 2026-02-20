"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export interface SaveRandomizerRollParams {
    questType: "MAIN" | "SIDE";
    candidates: {
        id: string; // ID from IGDB
        nome: string;
        imageUrl: string;
    }[];
    winnerId: string; // Result from local state roll
}

export async function saveRandomizerRoll(params: SaveRandomizerRollParams) {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Usuário não autenticado");
    }

    const userId = session.user.id;
    const { questType, candidates, winnerId } = params;

    // Determinar o enum correto do Prisma
    const typeEnum = questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";

    try {
        // Usa uma transação para garantir que tudo salva junto
        const result = await prisma.$transaction(async (tx) => {

            // 1. Criar ou atualizar os Jogos na tabela Game
            // Como IDs podem conflitar com UUID padrão (se usarmos o ID do IGDB), 
            // no nosso esquema `Game` usa UUID default. Vamos buscar por 'title' como heurística 
            // ou criar novo se não existir, para não poluir com duplicados no banco
            const savedGames = await Promise.all(candidates.map(async (candidate) => {
                const existingGame = await tx.game.findFirst({
                    where: { title: candidate.nome }
                });

                if (existingGame) {
                    // Atualizar capa se aplicável
                    if (!existingGame.cover_url && candidate.imageUrl) {
                        return tx.game.update({
                            where: { id: existingGame.id },
                            data: { cover_url: candidate.imageUrl }
                        });
                    }
                    return existingGame;
                }

                // Definimos como SUGGESTED inicialmente
                return tx.game.create({
                    data: {
                        title: candidate.nome,
                        cover_url: candidate.imageUrl,
                        quest_type: typeEnum,
                        status: "SUGGESTED",
                        nominated_by_id: userId
                    }
                });
            }));

            // Identificar o vencedor recém-retornado ou criado do banco
            const winnerCandidate = candidates.find(c => c.id === winnerId);
            const savedWinner = savedGames.find(g => g.title === winnerCandidate?.nome);

            if (!savedWinner) {
                throw new Error("Erro ao identificar o jogo vencedor.");
            }

            // 2. Atualizar o vencedor para ACTIVE
            await tx.game.update({
                where: { id: savedWinner.id },
                data: {
                    status: "ACTIVE",
                    start_date: new Date()
                }
            });

            // 3. Criar a Pool (sorteio)
            const pool = await tx.pool.create({
                data: {
                    type: typeEnum,
                    status: "CLOSED", // Já criado finalizado, pois sorteamos no frontend
                    winner_game_id: savedWinner.id,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                }
            });

            // 4. Atrelar os jogos à Pool 
            // (A regra de "quem adicionou" está indo o usuário atual para todos nesta V1)
            await Promise.all(savedGames.map(game => {
                return tx.poolEntry.create({
                    data: {
                        pool_id: pool.id,
                        game_id: game.id,
                        user_id: userId
                    }
                });
            }));

            return pool.id;
        });

        return { success: true, poolId: result };
    } catch (error: any) {
        console.error("Erro ao salvar Randomizer DB:", error);

        // Escreve do log p/ arquivo local para debugar
        const fs = require('fs');
        fs.writeFileSync('prisma-error-dump.txt', String(error) + '\nStack:\n' + (error?.stack || '') + '\nMessage:\n' + (error?.message || ''));

        return { success: false, error: "Erro interno: " + (error?.message || "Desconhecido") };
    }
}
