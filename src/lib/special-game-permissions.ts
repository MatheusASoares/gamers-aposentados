import { prisma } from "@/lib/prisma";
import { isRandomizerPlayer } from "@/lib/randomizer-players";

/**
 * Valida se um usuário tem permissão para votar em uma proposta de Pausa Ativa específica.
 * Proteção contra BOLA / IDOR (CWE-639): se a proposta pertencer a uma guilda,
 * o usuário DEVE ser membro ativo dessa guilda.
 */
export async function validateSpecialGameVotePermission(
    proposal: { guild_id?: string | null },
    userId: string,
    userEmail?: string | null
): Promise<{ allowed: boolean; error?: string }> {
    if (proposal.guild_id) {
        const membership = await prisma.guildMember.findUnique({
            where: {
                guild_id_user_id: {
                    guild_id: proposal.guild_id,
                    user_id: userId,
                },
            },
        });

        if (!membership || !membership.is_active) {
            return {
                allowed: false,
                error: "Você não tem permissão para votar nas propostas desta guilda.",
            };
        }
        return { allowed: true };
    }

    // Proposta legada/global sem guilda vinculada: restringir aos jogadores oficiais
    if (!isRandomizerPlayer(userEmail)) {
        return {
            allowed: false,
            error: "Você não tem permissão para votar em propostas de Pausa Ativa.",
        };
    }

    return { allowed: true };
}

/**
 * Valida se um usuário tem permissão para cancelar uma proposta pendente.
 * Proteção contra BOLA / IDOR: Apenas o proponente original ou um líder ativo da guilda pode cancelar.
 */
export async function validateSpecialGameCancelPermission(
    proposal: { proposer_id: string; guild_id?: string | null },
    userId: string
): Promise<{ allowed: boolean; error?: string }> {
    if (proposal.proposer_id === userId) {
        return { allowed: true };
    }

    if (proposal.guild_id) {
        const membership = await prisma.guildMember.findUnique({
            where: {
                guild_id_user_id: {
                    guild_id: proposal.guild_id,
                    user_id: userId,
                },
            },
        });
        if (membership && membership.is_active && membership.role === "LEADER") {
            return { allowed: true };
        }
    }

    return {
        allowed: false,
        error: "Apenas o autor da proposta ou um Líder da guilda pode cancelá-la.",
    };
}
