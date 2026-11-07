// tests/pools-api-security.spec.ts

import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import {
    getUserPools,
    createUserPool,
    updateUserPool,
} from "../src/app/api/pools/route";

test.describe("Security & Multi-Tenancy: Pools API (Audit Items 2.2 & 2.3)", () => {
    const timestamp = Date.now();
    let userAId: string;
    let userBId: string;
    let userCMemberId: string;
    let guildAId: string;
    let guildBId: string;
    let poolAId: string;
    let poolBId: string;
    let poolLegacyId: string;

    test.beforeAll(async () => {
        // 1. Criar Usuários
        const userA = await prisma.user.create({
            data: {
                username: `leader_a_${timestamp}`,
                name: "Leader Aposentados",
                email: `leader-a-${timestamp}@test.com`,
            },
        });
        userAId = userA.id;

        const userB = await prisma.user.create({
            data: {
                username: `kaleb_leader_${timestamp}`,
                name: "Kaleb Legendarios",
                email: `kaleb-legendarios-${timestamp}@test.com`,
            },
        });
        userBId = userB.id;

        const userCMember = await prisma.user.create({
            data: {
                username: `member_b_${timestamp}`,
                name: "Common Member B",
                email: `member-b-${timestamp}@test.com`,
            },
        });
        userCMemberId = userCMember.id;

        // 2. Criar Guildas
        const guildA = await prisma.guild.create({
            data: {
                name: `Aposentados Sec ${timestamp}`,
                slug: `aposentados-sec-${timestamp}`,
                invite_code: `APS${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userAId,
                members: {
                    create: [{ user_id: userAId, role: "LEADER", is_active: true }],
                },
            },
        });
        guildAId = guildA.id;

        const guildB = await prisma.guild.create({
            data: {
                name: `Legendarios Sec ${timestamp}`,
                slug: `legendarios-sec-${timestamp}`,
                invite_code: `LGS${Math.floor(1000 + Math.random() * 9000)}`,
                owner_id: userBId,
                members: {
                    create: [
                        { user_id: userBId, role: "LEADER", is_active: true },
                        { user_id: userCMemberId, role: "MEMBER", is_active: true },
                    ],
                },
            },
        });
        guildBId = guildB.id;

        // 3. Criar Potes
        const poolA = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "OPEN",
                guild_id: guildAId,
            },
        });
        poolAId = poolA.id;

        const poolB = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "OPEN",
                guild_id: guildBId,
            },
        });
        poolBId = poolB.id;

        const poolLegacy = await prisma.pool.create({
            data: {
                type: "MAIN_QUEST",
                status: "OPEN",
                guild_id: null,
            },
        });
        poolLegacyId = poolLegacy.id;
    });

    test.afterAll(async () => {
        // Limpeza
        await prisma.pool.deleteMany({
            where: { id: { in: [poolAId, poolBId, poolLegacyId] } },
        });
        // Deletar potes criados dinamicamente nos testes
        await prisma.pool.deleteMany({
            where: { guild_id: { in: [guildAId, guildBId] } },
        });
        await prisma.guildMember.deleteMany({
            where: { guild_id: { in: [guildAId, guildBId] } },
        });
        await prisma.guild.deleteMany({
            where: { id: { in: [guildAId, guildBId] } },
        });
        await prisma.user.deleteMany({
            where: { id: { in: [userAId, userBId, userCMemberId] } },
        });
    });

    test.describe("1. Proteção de Acesso Não-Autenticado (Item 2.2)", () => {
        test("getUserPools sem usuário autenticado retorna HTTP 401", async () => {
            const res = await getUserPools(undefined);
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
        });

        test("createUserPool sem usuário autenticado retorna HTTP 401", async () => {
            const res = await createUserPool(null, { type: "MAIN_QUEST" });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
        });

        test("updateUserPool sem usuário autenticado retorna HTTP 401", async () => {
            const res = await updateUserPool("", { id: poolAId });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
        });
    });

    test.describe("2. Isolamento Multi-Tenancy no GET /api/pools (Item 2.2)", () => {
        test("Usuário da Guilda A lista apenas potes da Guilda A", async () => {
            const res = await getUserPools(userAId);
            expect(res.status).toBe(200);
            const pools = res.body as Array<{ id: string; guild_id: string | null }>;
            const poolIds = pools.map((p) => p.id);

            expect(poolIds).toContain(poolAId);
            expect(poolIds).not.toContain(poolBId);
        });

        test("Usuário da Guilda B (Legendários) lista apenas potes da Guilda B", async () => {
            const res = await getUserPools(userBId);
            expect(res.status).toBe(200);
            const pools = res.body as Array<{ id: string; guild_id: string | null }>;
            const poolIds = pools.map((p) => p.id);

            expect(poolIds).toContain(poolBId);
            expect(poolIds).not.toContain(poolAId);
            // Não deve enxergar potes legados de fundadores
            expect(poolIds).not.toContain(poolLegacyId);
        });

        test("Tentativa de acessar pote de outra guilda por ID direto retorna HTTP 404 (Anti-Enumeração)", async () => {
            // Usuário B tenta consultar Pote A
            const resBVisitingA = await getUserPools(userBId, poolAId);
            expect(resBVisitingA.status).toBe(404);
            expect(resBVisitingA.body).toEqual({ error: "Pool not found" });

            // Usuário A tenta consultar Pote B
            const resAVisitingB = await getUserPools(userAId, poolBId);
            expect(resAVisitingB.status).toBe(404);
            expect(resAVisitingB.body).toEqual({ error: "Pool not found" });
        });

        test("Usuário da Guilda B consultando seu próprio pote por ID obtém sucesso", async () => {
            const res = await getUserPools(userBId, poolBId);
            expect(res.status).toBe(200);
            expect((res.body as any).id).toBe(poolBId);
        });
    });

    test.describe("3. Autorização RBAC para Líderes de Qualquer Guilda (Item 2.3)", () => {
        test("Líder de outra guilda (Kaleb na Guilda B) consegue criar pote com sucesso", async () => {
            const res = await createUserPool(userBId, {
                type: "SIDE_QUEST",
                month: 11,
                year: 2026,
            });

            expect(res.status).toBe(201);
            const createdPool = res.body as any;
            expect(createdPool.guild_id).toBe(guildBId);
            expect(createdPool.type).toBe("SIDE_QUEST");
        });

        test("Membro comum (MEMBER) é bloqueado com HTTP 403 ao tentar criar pote", async () => {
            const res = await createUserPool(userCMemberId, {
                type: "MAIN_QUEST",
            });

            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: "Forbidden" });
        });

        test("Membro comum (MEMBER) é bloqueado com HTTP 403 ao tentar atualizar ou sortear pote", async () => {
            const res = await updateUserPool(userCMemberId, {
                id: poolBId,
                status: "CLOSED",
            });

            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: "Forbidden" });
        });

        test("Líder da Guilda A é bloqueado com HTTP 403 ao tentar alterar pote da Guilda B", async () => {
            const res = await updateUserPool(userAId, {
                id: poolBId,
                status: "CLOSED",
            });

            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: "Forbidden" });
        });

        test("Líder da Guilda B consegue atualizar status de pote da sua própria guilda", async () => {
            const res = await updateUserPool(userBId, {
                id: poolBId,
                month: 12,
            });

            expect(res.status).toBe(200);
            expect((res.body as any).month).toBe(12);
        });
    });
});

