import { test, expect } from "@playwright/test";
import { sanitizeApicalypseQuery } from "../src/lib/igdb-utils";

test.describe("IGDB Apicalypse Query Sanitization (CWE-943)", () => {
    test("neutralizes quotes, backslashes, semicolons, and control characters properly", () => {
        // 1. Standard text unchanged
        expect(sanitizeApicalypseQuery("The Witcher 3")).toBe("The Witcher 3");

        // 2. Escaping double quotes
        expect(sanitizeApicalypseQuery('Resident Evil "Nemesis"')).toBe('Resident Evil \\"Nemesis\\"');
        expect(sanitizeApicalypseQuery('A "Game" of "Thrones"')).toBe('A \\"Game\\" of \\"Thrones\\"');

        // 3. Semicolons stripped to prevent statement chaining / clause breakout
        expect(sanitizeApicalypseQuery('Dark Souls"; where rating > 90;')).toBe('Dark Souls\\" where rating > 90');

        // 4. Backslashes properly escaped
        expect(sanitizeApicalypseQuery("Metal\\Gear")).toBe("Metal\\\\Gear");

        // 5. Newlines and tabs replaced with space
        expect(sanitizeApicalypseQuery("Grand\nTheft\tAuto\rV")).toBe("Grand Theft Auto V");

        // 6. Complex injection payload
        expect(sanitizeApicalypseQuery('Inject"; fields *; where id = 1;\n//')).toBe('Inject\\" fields * where id = 1 //');

        // 7. Empty and whitespace inputs
        expect(sanitizeApicalypseQuery("")).toBe("");
        expect(sanitizeApicalypseQuery("   ")).toBe("");
    });
});
