import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { isGuildMaster } from "../src/lib/permissions";
import { RANDOMIZER_PLAYER_EMAILS } from "../src/lib/randomizer-players";

test.describe("RBAC Permissions and Roles Suite", () => {
    test("Guild Masters (Matheus & Lucas) are properly recognized as GUILD_MASTER", () => {
        for (const email of RANDOMIZER_PLAYER_EMAILS) {
            expect(isGuildMaster({ email, role: "GUILD_MASTER" })).toBe(true);
            expect(isGuildMaster({ email })).toBe(true);
        }
    });

    test("New Member is recognized as MEMBER and NOT Guild Master", () => {
        const memberUser = {
            id: "user-member-123",
            email: "jogador_comunidade@gmail.com",
            role: "MEMBER" as const,
        };

        expect(isGuildMaster(memberUser)).toBe(false);
    });

    test("Database User role defaults to MEMBER for new registrations", async () => {
        const testEmail = `new_member_${Date.now()}@gamers.com`;
        const newUser = await prisma.user.create({
            data: {
                email: testEmail,
                username: `gamer_${Date.now()}`,
            },
        });

        expect(newUser.role).toBe("MEMBER");
        expect(newUser.notice_board_tokens).toBe(2);

        // Cleanup
        await prisma.user.delete({ where: { id: newUser.id } });
    });

    test("Security: @test.com email does NOT grant Guild Master in production environment", () => {
        const originalEnv = process.env.NODE_ENV;
        try {
            (process.env as { NODE_ENV?: string }).NODE_ENV = "production";
            
            const attackerUser = {
                id: "attacker-id",
                email: "attacker@test.com",
                role: "MEMBER" as const,
            };

            expect(isGuildMaster(attackerUser)).toBe(false);
            expect(isGuildMaster({ email: "attacker@test.com" })).toBe(false);

            // Official Guild Masters must still have access in production
            expect(isGuildMaster({ email: "matheus31also@gmail.com" })).toBe(true);
            expect(isGuildMaster({ email: "lucasedu17gomes@gmail.com" })).toBe(true);
        } finally {
            if (originalEnv === undefined) {
                delete (process.env as { NODE_ENV?: string }).NODE_ENV;
            } else {
                (process.env as { NODE_ENV?: string }).NODE_ENV = originalEnv;
            }
        }
    });
});
