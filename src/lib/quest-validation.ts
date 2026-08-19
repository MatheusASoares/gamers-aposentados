import { z } from "zod";

/**
 * Schema de validação para atualização de progresso de quests (0% a 100%)
 */
export const updateQuestProgressSchema = z.object({
    gameId: z.string().min(1, "O ID do jogo é obrigatório."),
    percentage: z
        .number({ message: "A porcentagem de progresso deve ser um número." })
        .int("A porcentagem de progresso deve ser um número inteiro.")
        .min(0, "A porcentagem de progresso deve ser no mínimo 0%.")
        .max(100, "A porcentagem de progresso deve ser no máximo 100%."),
});

export type UpdateQuestProgressInput = z.infer<typeof updateQuestProgressSchema>;
