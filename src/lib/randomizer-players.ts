/**
 * Randomizer Players Configuration
 *
 * Only these users (identified by email) can add games to the Randomizer pools.
 * Other users can view the dashboard, reviews, etc., but cannot modify pools.
 */

export const RANDOMIZER_PLAYER_EMAILS = ["matheus31also@gmail.com", "lucasedu17gomes@gmail.com"];

/**
 * Display name mapping for the pool UI.
 * Used to show the "other player" section when only one has selections.
 */
export const PLAYER_DISPLAY_NAMES: Record<string, string> = {
    "matheus31also@gmail.com": "Matheus",
    "lucasedu17gomes@gmail.com": "Lucas",
};

export function isRandomizerPlayer(email: string | null | undefined): boolean {
    if (!email) return false;
    const lower = email.toLowerCase();
    if (RANDOMIZER_PLAYER_EMAILS.includes(lower)) return true;

    // Em ambiente de teste e desenvolvimento, permite contas @test.com para testes automatizados
    const isTestEnv = process.env.NODE_ENV !== "production";
    if (isTestEnv && lower.endsWith("@test.com")) {
        return true;
    }
    return false;
}

export function getOtherPlayerName(myEmail: string | null | undefined): string {
    if (!myEmail) return "Outro Jogador";
    const otherEmail = RANDOMIZER_PLAYER_EMAILS.find(
        (e) => e.toLowerCase() !== myEmail.toLowerCase(),
    );
    return otherEmail ? PLAYER_DISPLAY_NAMES[otherEmail] || "Outro Jogador" : "Outro Jogador";
}
