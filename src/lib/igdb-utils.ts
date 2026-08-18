/**
 * Sanitizes input strings before interpolation into IGDB Apicalypse queries.
 * Escapes backslashes and double quotes, and strips semicolons and control characters.
 */
export function sanitizeApicalypseQuery(input: string): string {
    if (!input) return "";
    return input
        .replace(/\\/g, "\\\\") // Escape backslashes
        .replace(/"/g, '\\"') // Escape double quotes
        .replace(/[\r\n\t]/g, " ") // Remove line breaks/tabs
        .replace(/;/g, "") // Strip semicolons to prevent clause breakout
        .trim();
}
