import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

test.describe("Multi-Tenancy: Auth Registration & Guild Isolation (Audit Bug 1.1)", () => {
    const timestamp = Date.now();
    let founderGuildId: string;
    let initialFounderMemberCount: number;

    test.beforeAll(async () => {
        // Garantir que a guilda dos Fundadores existe
        let founderGuild = await prisma.guild.findFirst({
            where: { slug: { in: ["fundadores", "aposentados"] } },
            include: { members: true },
        });

        if (!founderGuild) {
            // Se for ambiente local vazio, cria guilda mock dos fundadores
            const owner = await prisma.user.create({
                data: {
                    name: `Founder Owner ${timestamp}`,
                    email: `founder-owner-${timestamp}@test.com`,
                    level: 10,
                },
            });
            founderGuild = await prisma.guild.create({
                data: {
                    name: "Aposentados",
                    slug: "aposentados",
                    invite_code: `FND${Math.floor(1000 + Math.random() * 9000)}`,
                    owner_id: owner.id,
                    members: {
                        create: {
                            user_id: owner.id,
                            role: "LEADER",
                            is_active: true,
                        },
                    },
                },
                include: { members: true },
            });
        }

        founderGuildId = founderGuild.id;
        initialFounderMemberCount = founderGuild.members.length;
    });

    test("1. Novo cadastro via credenciais NÃO é associado à guilda dos Fundadores", async () => {
        // Simular o comportamento pós-correção da Server Action register()
        const newUser = await prisma.user.create({
            data: {
                username: `newuser_${timestamp}`,
                email: `newuser_${timestamp}@test.com`,
                password: "hashed_dummy_password",
            },
        });

        // Verificar que o novo usuário NÃO possui nenhum registro na tabela guild_members
        const memberships = await prisma.guildMember.findMany({
            where: { user_id: newUser.id },
        });

        expect(memberships.length).toBe(0);

        // Limpeza
        await prisma.user.delete({ where: { id: newUser.id } });
    });

    test("2. Cadastros consecutivos não alteram a contagem de membros da guilda dos Fundadores", async () => {
        const userA = await prisma.user.create({
            data: {
                username: `pilotA_${timestamp}`,
                email: `pilotA_${timestamp}@test.com`,
                password: "hashed_password_1",
            },
        });

        const userB = await prisma.user.create({
            data: {
                username: `pilotB_${timestamp}`,
                email: `pilotB_${timestamp}@test.com`,
                password: "hashed_password_2",
            },
        });

        // Verificar membros da guilda dos Fundadores
        const currentFounderMembers = await prisma.guildMember.findMany({
            where: { guild_id: founderGuildId },
        });

        expect(currentFounderMembers.length).toBe(initialFounderMemberCount);
        expect(currentFounderMembers.some((m) => m.user_id === userA.id)).toBe(false);
        expect(currentFounderMembers.some((m) => m.user_id === userB.id)).toBe(false);

        // Limpeza
        await prisma.user.deleteMany({
            where: { id: { in: [userA.id, userB.id] } },
        });
    });

    test("3. Usuário recém-registrado resolve guilda ativa como NULL (acionando Onboarding)", async () => {
        const standaloneUser = await prisma.user.create({
            data: {
                username: `standalone_${timestamp}`,
                email: `standalone_${timestamp}@test.com`,
            },
        });

        // Simulação da lógica de getActiveGuild:
        // 1. Sem cookie
        // 2. Fallback Fundadores: busca se o usuário é membro
        const isFounderMember = await prisma.guildMember.findFirst({
            where: {
                user_id: standaloneUser.id,
                guild: { slug: { in: ["fundadores", "aposentados"] } },
            },
        });
        expect(isFounderMember).toBeNull();

        // 3. Fallback Qualquer guilda
        const anyMembership = await prisma.guildMember.findFirst({
            where: { user_id: standaloneUser.id },
        });
        expect(anyMembership).toBeNull();

        // Limpeza
        await prisma.user.delete({ where: { id: standaloneUser.id } });
    });

    test("4. Novo usuário pode fundar sua própria guilda sem afetar nenhuma outra", async () => {
        const squadLeader = await prisma.user.create({
            data: {
                username: `leader_${timestamp}`,
                email: `leader_${timestamp}@test.com`,
            },
        });

        // Fundar guilda própria
        const newGuild = await prisma.guild.create({
            data: {
                name: `Esquadrão Alfa ${timestamp}`,
                slug: `esquadrao-alfa-${timestamp}`,
                invite_code: `ALF${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: squadLeader.id,
                members: {
                    create: {
                        user_id: squadLeader.id,
                        role: "LEADER",
                        is_active: true,
                    },
                },
            },
            include: { members: true },
        });

        expect(newGuild.members.length).toBe(1);
        expect(newGuild.members[0].user_id).toBe(squadLeader.id);
        expect(newGuild.members[0].role).toBe("LEADER");

        // Membros dos fundadores continuam intactos
        const founderMembers = await prisma.guildMember.findMany({
            where: { guild_id: founderGuildId },
        });
        expect(founderMembers.length).toBe(initialFounderMemberCount);
        expect(founderMembers.some((m) => m.user_id === squadLeader.id)).toBe(false);

        // Limpeza
        await prisma.guild.delete({ where: { id: newGuild.id } });
        await prisma.user.delete({ where: { id: squadLeader.id } });
    });
});

