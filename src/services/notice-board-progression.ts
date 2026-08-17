import { prisma } from "@/lib/prisma";

/**
 * Garante que todos os contratos da campanha de um jogo possuam registros de progresso
 * para o usuário especificado.
 *
 * Se o usuário não possuir nenhum registro de progresso para o jogo:
 * - O contrato com o menor sequence_order (ex: #1) é inicializado como "AVAILABLE".
 * - Os demais contratos são inicializados como "LOCKED".
 *
 * É uma operação idempotente e segura para chamadas concorrentes.
 */
export async function ensureUserContractProgress(userId: string, gameId: string) {
    if (!userId || !gameId) return;

    try {
        // 1. Buscar todos os contratos da campanha para o jogo
        const contracts = await prisma.campaignContract.findMany({
            where: { game_id: gameId },
            orderBy: { sequence_order: "asc" },
        });

        if (contracts.length === 0) return;

        // 2. Buscar progressos já existentes para o usuário neste jogo
        const existingProgresses = await prisma.campaignContractProgress.findMany({
            where: {
                user_id: userId,
                contract_id: { in: contracts.map((c) => c.id) },
            },
        });

        const existingContractIds = new Set(existingProgresses.map((p) => p.contract_id));
        const missingContracts = contracts.filter((c) => !existingContractIds.has(c.id));

        if (missingContracts.length === 0) return;

        // 3. Se o usuário não tem nenhum progresso registrado para este jogo,
        // o primeiro contrato (menor sequence_order) deve ser AVAILABLE, os demais LOCKED.
        const isBrandNewProgress = existingProgresses.length === 0;

        const progressToCreate = missingContracts.map((contract) => {
            const isFirst = isBrandNewProgress && contract.sequence_order === contracts[0].sequence_order;
            return {
                user_id: userId,
                contract_id: contract.id,
                status: isFirst ? ("AVAILABLE" as const) : ("LOCKED" as const),
            };
        });

        await prisma.campaignContractProgress.createMany({
            data: progressToCreate,
            skipDuplicates: true,
        });
    } catch (error) {
        console.error("Erro ao garantir progresso de contratos do usuário:", error);
    }
}
