"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, QuestType } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { isRandomizerPlayer, RANDOMIZER_PLAYER_EMAILS } from "@/lib/randomizer-players";
import { getRandomizerStatus } from "./quest-actions";
import { validateGameEligibilityForPool } from "./pool-actions";

export interface SpecialProposalDTO {
    id: string;
    quest_type: QuestType;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
    igdb_id: string | null;
    game_title: string;
    game_cover_url: string | null;
    existing_game_id: string | null;
    proposer_id: string;
    proposer: {
        id: string;
        name: string | null;
        username: string | null;
        email?: string | null;
    };
    votes: {
        id: string;
        user_id: string;
        approved: boolean;
        user: {
            id: string;
            name: string | null;
            username: string | null;
            email?: string | null;
        };
    }[];
    created_at: Date;
}

/**
 * Cria uma proposta de Pausa Ativa / Jogo Especial para votação da guilda.
 */
export async function proposeSpecialGame(
    questType: "MAIN" | "SIDE",
    game: { id?: string; igdbId?: string | null; nome: string; imageUrl?: string | null }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    if (!isRandomizerPlayer(userEmail)) {
        return {
            success: false,
            error: "Você não tem permissão para propor uma Pausa Ativa.",
        };
    }

    const typeEnum: QuestType = questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST";

    // Validar se já existe um jogo ativo travado
    const status = await getRandomizerStatus(typeEnum);
    if (status.locked) {
        return {
            success: false,
            error: status.message || "Já existe uma quest ativa para esta categoria.",
        };
    }

    // Verificar se já existe uma proposta pendente para esta categoria
    const existingPending = await prisma.specialGameProposal.findFirst({
        where: {
            quest_type: typeEnum,
            status: "PENDING",
        },
    });

    if (existingPending) {
        return {
            success: false,
            error: "Já existe uma proposta de Pausa Ativa em andamento para esta categoria.",
        };
    }

    try {
        // Se for jogo já existente no banco, validar elegibilidade
        if (game.id) {
            const eligibility = await prisma.$transaction(async (tx) => {
                return validateGameEligibilityForPool(tx, game.id!);
            });
            if (!eligibility.eligible) {
                return {
                    success: false,
                    error: `Jogo inelegível: ${eligibility.error}`,
                };
            }
        }

        const proposal = await prisma.specialGameProposal.create({
            data: {
                quest_type: typeEnum,
                status: "PENDING",
                igdb_id: game.igdbId || null,
                game_title: game.nome,
                game_cover_url: game.imageUrl || null,
                existing_game_id: game.id || null,
                proposer_id: userId,
                votes: {
                    create: {
                        user_id: userId,
                        approved: true,
                    },
                },
            },
            include: {
                proposer: {
                    select: { id: true, name: true, username: true, email: true },
                },
                votes: {
                    include: {
                        user: { select: { id: true, name: true, username: true, email: true } },
                    },
                },
            },
        });

        revalidatePath("/randomizer");
        revalidatePath("/");
        revalidatePath("/dashboard");

        return {
            success: true,
            message: `Proposta de Pausa Ativa para "${game.nome}" enviada com sucesso! Aguardando confirmação do outro jogador.`,
            proposal,
        };
    } catch (err) {
        console.error("Erro ao criar proposta de Pausa Ativa:", err);
        return {
            success: false,
            error: "Erro no servidor ao criar proposta de Pausa Ativa.",
        };
    }
}

/**
 * Vota em uma proposta de Pausa Ativa (Aceitar ou Recusar).
 * Atingindo 2/2 aprovações, ativa o jogo com a tag de Special Release.
 */
export async function voteSpecialGameProposal(proposalId: string, approved: boolean) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    if (!isRandomizerPlayer(userEmail)) {
        return {
            success: false,
            error: "Você não tem permissão para votar em propostas de Pausa Ativa.",
        };
    }

    try {
        const proposal = await prisma.specialGameProposal.findUnique({
            where: { id: proposalId },
            include: {
                votes: true,
                proposer: true,
            },
        });

        if (!proposal) {
            return { success: false, error: "Proposta não encontrada." };
        }

        if (proposal.status !== "PENDING") {
            return {
                success: false,
                error: `Esta proposta não está mais aberta para votação (Status atual: ${proposal.status}).`,
            };
        }

        // Se o voto for de RECUSA (Rejeição)
        if (!approved) {
            await prisma.$transaction(async (tx) => {
                await tx.specialGameVote.upsert({
                    where: {
                        proposal_id_user_id: {
                            proposal_id: proposal.id,
                            user_id: userId,
                        },
                    },
                    create: {
                        proposal_id: proposal.id,
                        user_id: userId,
                        approved: false,
                    },
                    update: {
                        approved: false,
                    },
                });

                await tx.specialGameProposal.update({
                    where: { id: proposal.id },
                    data: { status: "REJECTED" },
                });
            });

            revalidatePath("/randomizer");
            revalidatePath("/");
            revalidatePath("/dashboard");

            return {
                success: true,
                status: "REJECTED" as const,
                message: `Proposta de Pausa Ativa para "${proposal.game_title}" foi recusada.`,
            };
        }

        // Se o voto for de APROVAÇÃO
        const result = await prisma.$transaction(async (tx) => {
            // 1. Registra o voto afirmativo
            await tx.specialGameVote.upsert({
                where: {
                    proposal_id_user_id: {
                        proposal_id: proposal.id,
                        user_id: userId,
                    },
                },
                create: {
                    proposal_id: proposal.id,
                    user_id: userId,
                    approved: true,
                },
                update: {
                    approved: true,
                },
            });

            // 2. Busca todos os votos positivos da proposta
            const approvedVotes = await tx.specialGameVote.findMany({
                where: {
                    proposal_id: proposal.id,
                    approved: true,
                },
            });

            const activeUsers = await tx.user.findMany({
                where: { email: { in: RANDOMIZER_PLAYER_EMAILS } },
            });

            // Se atingir o quórum (2/2 jogadores oficiais aprovaram)
            const quorumReached = approvedVotes.length >= 2 || approvedVotes.length >= activeUsers.length;

            if (quorumReached) {
                // 3. Atualiza status da proposta para ACCEPTED
                await tx.specialGameProposal.update({
                    where: { id: proposal.id },
                    data: { status: "ACCEPTED" },
                });

                // 4. Cria ou atualiza o Game com a tag is_special_release: true
                let dbGame;
                if (proposal.existing_game_id) {
                    dbGame = await tx.game.findUnique({
                        where: { id: proposal.existing_game_id },
                    });
                } else {
                    dbGame = await tx.game.findFirst({
                        where: {
                            OR: [
                                proposal.igdb_id ? { igdb_id: proposal.igdb_id } : undefined,
                                { title: proposal.game_title },
                            ].filter(Boolean) as Prisma.GameWhereInput[],
                        },
                    });
                }

                if (!dbGame) {
                    dbGame = await tx.game.create({
                        data: {
                            igdb_id: proposal.igdb_id || null,
                            title: proposal.game_title,
                            cover_url: proposal.game_cover_url || null,
                            quest_type: proposal.quest_type,
                            nominated_by_id: proposal.proposer_id,
                            is_special_release: true,
                        },
                    });
                } else {
                    dbGame = await tx.game.update({
                        where: { id: dbGame.id },
                        data: {
                            igdb_id: dbGame.igdb_id || proposal.igdb_id || null,
                            cover_url: dbGame.cover_url || proposal.game_cover_url || null,
                            is_special_release: true,
                        },
                    });
                }

                // 5. Cria uma Pool fechada dedicada para a Special Release
                const specialPool = await tx.pool.create({
                    data: {
                        type: proposal.quest_type,
                        status: "CLOSED",
                        winner_game_id: dbGame.id,
                        is_special: true,
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                    },
                });

                // 6. Cria o PoolEntry correspondente
                await tx.poolEntry.create({
                    data: {
                        pool_id: specialPool.id,
                        game_id: dbGame.id,
                        user_id: proposal.proposer_id,
                    },
                });

                // 7. Ativa o GameProgress para ambos os usuários oficiais
                for (const user of activeUsers) {
                    await tx.gameProgress.upsert({
                        where: {
                            user_id_game_id: {
                                user_id: user.id,
                                game_id: dbGame.id,
                            },
                        },
                        update: {
                            status: "ACTIVE",
                            start_date: new Date(),
                            end_date: null,
                        },
                        create: {
                            user_id: user.id,
                            game_id: dbGame.id,
                            status: "ACTIVE",
                            progress_percentage: 0,
                            start_date: new Date(),
                        },
                    });
                }

                return {
                    quorumReached: true,
                    status: "ACCEPTED" as const,
                    gameTitle: dbGame.title,
                    coverUrl: dbGame.cover_url,
                };
            }

            return {
                quorumReached: false,
                status: "PENDING" as const,
                votesCount: approvedVotes.length,
            };
        });

        revalidatePath("/randomizer");
        revalidatePath("/");
        revalidatePath("/dashboard");

        return {
            success: true,
            ...result,
            message: result.quorumReached
                ? `Consenso atingido! "${result.gameTitle}" agora é a Quest Ativa Especial da guilda!`
                : "Voto registrado com sucesso. Aguardando quórum.",
        };
    } catch (err) {
        console.error("Erro ao votar em proposta de Pausa Ativa:", err);
        return {
            success: false,
            error: "Erro no servidor ao registrar voto da proposta.",
        };
    }
}

/**
 * Cancela uma proposta de Pausa Ativa pendente (ação restrita ao proponente).
 */
export async function cancelSpecialGameProposal(proposalId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Usuário não autenticado." };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    if (!isRandomizerPlayer(userEmail)) {
        return {
            success: false,
            error: "Você não tem permissão para cancelar esta proposta.",
        };
    }

    try {
        const proposal = await prisma.specialGameProposal.findUnique({
            where: { id: proposalId },
        });

        if (!proposal) {
            return { success: false, error: "Proposta não encontrada." };
        }

        if (proposal.proposer_id !== userId) {
            return {
                success: false,
                error: "Apenas o autor da proposta pode cancelá-la.",
            };
        }

        if (proposal.status !== "PENDING") {
            return {
                success: false,
                error: "Apenas propostas pendentes podem ser canceladas.",
            };
        }

        await prisma.specialGameProposal.update({
            where: { id: proposal.id },
            data: { status: "CANCELLED" },
        });

        revalidatePath("/randomizer");
        revalidatePath("/");
        revalidatePath("/dashboard");

        return {
            success: true,
            message: "Proposta de Pausa Ativa cancelada com sucesso.",
        };
    } catch (err) {
        console.error("Erro ao cancelar proposta de Pausa Ativa:", err);
        return {
            success: false,
            error: "Erro no servidor ao cancelar a proposta.",
        };
    }
}

/**
 * Recupera propostas de Pausa Ativa pendentes para renderização de banners e votações.
 */
export async function getPendingSpecialGameProposals(questType?: "MAIN" | "SIDE"): Promise<SpecialProposalDTO[]> {
    try {
        const typeEnum = questType ? (questType === "MAIN" ? "MAIN_QUEST" : "SIDE_QUEST") : undefined;

        const proposals = await prisma.specialGameProposal.findMany({
            where: {
                status: "PENDING",
                ...(typeEnum ? { quest_type: typeEnum } : {}),
            },
            include: {
                proposer: {
                    select: { id: true, name: true, username: true, email: true },
                },
                votes: {
                    include: {
                        user: { select: { id: true, name: true, username: true, email: true } },
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        return proposals as unknown as SpecialProposalDTO[];
    } catch (err) {
        console.error("Erro ao buscar propostas pendentes:", err);
        return [];
    }
}
