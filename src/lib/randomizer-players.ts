/**
 * Randomizer Players & Guild Configuration
 *
 * Configurable via environment variables with backward-compatible defaults.
 */

const DEFAULT_RANDOMIZER_PLAYER_EMAILS = [
    "matheus31also@gmail.com",
    "lucasedu17gomes@gmail.com",
];

const DEFAULT_PLAYER_DISPLAY_NAMES: Record<string, string> = {
    "matheus31also@gmail.com": "Matheus",
    "lucasedu17gomes@gmail.com": "Lucas",
};

const DEFAULT_FOUNDER_GUILD_SLUGS = ["fundadores", "aposentados"];

/**
 * Retorna a lista de e-mails dos jogadores autorizados a adicionar jogos no sorteador.
 * Configurável via variável de ambiente RANDOMIZER_PLAYER_EMAILS (separada por vírgula).
 */
export function getRandomizerPlayerEmails(): string[] {
    if (process.env.RANDOMIZER_PLAYER_EMAILS) {
        return process.env.RANDOMIZER_PLAYER_EMAILS.split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
    }
    return DEFAULT_RANDOMIZER_PLAYER_EMAILS;
}

/**
 * Retorna a lista de slugs de guildas fundadoras/padrão da plataforma.
 * Configurável via variável de ambiente FOUNDER_GUILD_SLUGS (separada por vírgula).
 */
export function getFounderGuildSlugs(): string[] {
    if (process.env.FOUNDER_GUILD_SLUGS) {
        return process.env.FOUNDER_GUILD_SLUGS.split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
    }
    return DEFAULT_FOUNDER_GUILD_SLUGS;
}

/**
 * Retorna o mapa de apelidos/nomes de exibição dos jogadores.
 * Configurável opcionalmente via PLAYER_DISPLAY_NAMES_JSON (JSON string).
 */
export function getPlayerDisplayNames(): Record<string, string> {
    if (process.env.PLAYER_DISPLAY_NAMES_JSON) {
        try {
            return JSON.parse(process.env.PLAYER_DISPLAY_NAMES_JSON);
        } catch {
            // Em caso de JSON inválido, retorna os padrões
        }
    }
    return DEFAULT_PLAYER_DISPLAY_NAMES;
}

// Constantes exportadas para compatibilidade retroativa
export const RANDOMIZER_PLAYER_EMAILS = DEFAULT_RANDOMIZER_PLAYER_EMAILS;
export const PLAYER_DISPLAY_NAMES = DEFAULT_PLAYER_DISPLAY_NAMES;

export function isRandomizerPlayer(email: string | null | undefined): boolean {
    if (!email) return false;
    const lower = email.toLowerCase();
    const allowed = getRandomizerPlayerEmails();
    if (allowed.includes(lower)) return true;

    // Em ambiente de teste e desenvolvimento, permite contas @test.com para testes automatizados
    const isTestEnv = process.env.NODE_ENV !== "production";
    if (isTestEnv && lower.endsWith("@test.com")) {
        return true;
    }
    return false;
}

export function getOtherPlayerName(myEmail: string | null | undefined): string {
    if (!myEmail) return "Outro Jogador";
    const allowed = getRandomizerPlayerEmails();
    const names = getPlayerDisplayNames();
    const otherEmail = allowed.find(
        (e) => e.toLowerCase() !== myEmail.toLowerCase(),
    );
    return otherEmail ? names[otherEmail] || "Outro Jogador" : "Outro Jogador";
}
