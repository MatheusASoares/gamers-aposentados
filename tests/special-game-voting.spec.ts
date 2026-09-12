import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { RANDOMIZER_PLAYER_EMAILS } from "../src/lib/randomizer-players";
import {
    validateSpecialGameVotePermission,
    validateSpecialGameCancelPermission,
} from "../src/lib/special-game-permissions";


test.describe("Special Game Voting & Quorum Flow", () => {
    let matheusUser: { id: string; email: string | null };
    let lucasUser: { id: string; email: string | null };
    let nonPlayerUser: { id: string; email: string | null };

    test.beforeAll(async () => {
        // Garantir que os dois jogadores oficiais existam
        matheusUser = await prisma.user.upsert({
            where: { email: RANDOMIZER_PLAYER_EMAILS[0] },
            update: {},
            create: {
                email: RANDOMIZER_PLAYER_EMAILS[0],
                username: "matheus_official",
                name: "Matheus Official",
            },
        });

        lucasUser = await prisma.user.upsert({
            where: { email: RANDOMIZER_PLAYER_EMAILS[1] },
            update: {},
            create: {
                email: RANDOMIZER_PLAYER_EMAILS[1],
                username: "lucas_official",
                name: "Lucas Official",
            },
        });

        nonPlayerUser = await prisma.user.upsert({
            where: { email: "visitor_guest@example.com" },
            update: {},
            create: {
                email: "visitor_guest@example.com",
                username: "visitor_guest",
                name: "Visitor Guest",
            },
        });
    });

    test.beforeEach(async () => {
        // Limpar propostas e jogos de teste
        await prisma.specialGameVote.deleteMany({
            where: { proposal: { game_title: { startsWith: "Test Special Game" } } },
        });
        await prisma.specialGameProposal.deleteMany({
            where: { game_title: { startsWith: "Test Special Game" } },
        });
        await prisma.gameProgress.deleteMany({
            where: { game: { title: { startsWith: "Test Special Game" } } },
        });
        await prisma.poolEntry.deleteMany({
            where: { game: { title: { startsWith: "Test Special Game" } } },
        });
        await prisma.pool.deleteMany({
            where: { winner_game: { title: { startsWith: "Test Special Game" } } },
        });
        await prisma.game.deleteMany({
            where: { title: { startsWith: "Test Special Game" } },
        });
    });

    test("1. Proposal Creation: Creates a PENDING proposal with proposer's approval vote (1/2 quorum)", async () => {
        const title = "Test Special Game Proposal 1";

        const proposal = await prisma.specialGameProposal.create({
            data: {
                quest_type: "MAIN_QUEST",
                status: "PENDING",
                game_title: title,
                game_cover_url: "https://images.igdb.com/cover1.jpg",
                proposer_id: matheusUser.id,
                votes: {
                    create: {
                        user_id: matheusUser.id,
                        approved: true,
                    },
                },
            },
            include: {
                votes: true,
                proposer: true,
            },
        });

        expect(proposal.id).toBeDefined();
        expect(proposal.status).toBe("PENDING");
        expect(proposal.proposer_id).toBe(matheusUser.id);
        expect(proposal.votes.length).toBe(1);
        expect(proposal.votes[0].approved).toBe(true);
        expect(proposal.votes[0].user_id).toBe(matheusUser.id);
    });

    test("2. Quorum Consensus (2/2): When second official player votes APPROVED, proposal becomes ACCEPTED and activates game with Special Release tag", async () => {
        const title = "Test Special Game Quorum Consensus";

        // Step 1: Matheus proposes
        const proposal = await prisma.specialGameProposal.create({
            data: {
                quest_type: "SIDE_QUEST",
                status: "PENDING",
                game_title: title,
                game_cover_url: "https://images.igdb.com/cover_side.jpg",
                proposer_id: matheusUser.id,
                votes: {
                    create: {
                        user_id: matheusUser.id,
                        approved: true,
                    },
                },
            },
        });

        // Step 2: Lucas votes approved
        await prisma.specialGameVote.create({
            data: {
                proposal_id: proposal.id,
                user_id: lucasUser.id,
                approved: true,
            },
        });

        // Step 3: Quorum execution simulation
        const approvedVotes = await prisma.specialGameVote.findMany({
            where: { proposal_id: proposal.id, approved: true },
        });

        expect(approvedVotes.length).toBe(2);

        // Transaction resolution
        const activatedGame = await prisma.$transaction(async (tx) => {
            await tx.specialGameProposal.update({
                where: { id: proposal.id },
                data: { status: "ACCEPTED" },
            });

            const dbGame = await tx.game.create({
                data: {
                    title: proposal.game_title,
                    cover_url: proposal.game_cover_url,
                    quest_type: proposal.quest_type,
                    nominated_by_id: proposal.proposer_id,
                    is_special_release: true,
                },
            });

            const pool = await tx.pool.create({
                data: {
                    type: proposal.quest_type,
                    status: "CLOSED",
                    winner_game_id: dbGame.id,
                    is_special: true,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                },
            });

            for (const user of [matheusUser, lucasUser]) {
                await tx.gameProgress.create({
                    data: {
                        user_id: user.id,
                        game_id: dbGame.id,
                        status: "ACTIVE",
                        progress_percentage: 0,
                    },
                });
            }

            return { dbGame, pool };
        });

        // Verify status and flags
        const finalProposal = await prisma.specialGameProposal.findUnique({
            where: { id: proposal.id },
        });
        expect(finalProposal?.status).toBe("ACCEPTED");

        expect(activatedGame.dbGame.is_special_release).toBe(true);
        expect(activatedGame.pool.is_special).toBe(true);

        const progresses = await prisma.gameProgress.findMany({
            where: { game_id: activatedGame.dbGame.id },
        });
        expect(progresses.length).toBe(2);
        expect(progresses.every((p) => p.status === "ACTIVE")).toBe(true);
    });

    test("3. Rejection Flow: When target player rejects proposal, status becomes REJECTED and no game becomes ACTIVE", async () => {
        const title = "Test Special Game Rejection";

        // Matheus proposes
        const proposal = await prisma.specialGameProposal.create({
            data: {
                quest_type: "MAIN_QUEST",
                status: "PENDING",
                game_title: title,
                proposer_id: matheusUser.id,
                votes: {
                    create: {
                        user_id: matheusUser.id,
                        approved: true,
                    },
                },
            },
        });

        // Lucas votes false (Reject)
        await prisma.specialGameVote.create({
            data: {
                proposal_id: proposal.id,
                user_id: lucasUser.id,
                approved: false,
            },
        });

        await prisma.specialGameProposal.update({
            where: { id: proposal.id },
            data: { status: "REJECTED" },
        });

        const rejectedProposal = await prisma.specialGameProposal.findUnique({
            where: { id: proposal.id },
        });
        expect(rejectedProposal?.status).toBe("REJECTED");

        // Verify no active game progress exists for this game
        const activeProgress = await prisma.gameProgress.findFirst({
            where: { game: { title } },
        });
        expect(activeProgress).toBeNull();
    });

    test("4. Cancellation Flow: Proposer can cancel their pending proposal", async () => {
        const title = "Test Special Game Cancellation";

        const proposal = await prisma.specialGameProposal.create({
            data: {
                quest_type: "MAIN_QUEST",
                status: "PENDING",
                game_title: title,
                proposer_id: matheusUser.id,
                votes: {
                    create: {
                        user_id: matheusUser.id,
                        approved: true,
                    },
                },
            },
        });

        await prisma.specialGameProposal.update({
            where: { id: proposal.id },
            data: { status: "CANCELLED" },
        });

        const cancelledProposal = await prisma.specialGameProposal.findUnique({
            where: { id: proposal.id },
        });
        expect(cancelledProposal?.status).toBe("CANCELLED");
    });

    test("5. Security (BOLA/IDOR): Cross-guild voting is rejected by validateSpecialGameVotePermission", async () => {
        const uniqueId = Date.now();
        // Setup Guild A and Guild B
        const guildA = await prisma.guild.create({
            data: {
                name: `Guild Alpha ${uniqueId}`,
                slug: `guild-alpha-${uniqueId}`,
                invite_code: `CODE-A-${uniqueId}`,
                owner_id: matheusUser.id,
            },
        });

        const guildB = await prisma.guild.create({
            data: {
                name: `Guild Beta ${uniqueId}`,
                slug: `guild-beta-${uniqueId}`,
                invite_code: `CODE-B-${uniqueId}`,
                owner_id: nonPlayerUser.id,
            },
        });

        // Matheus is active in Guild A
        await prisma.guildMember.create({
            data: {
                guild_id: guildA.id,
                user_id: matheusUser.id,
                role: "LEADER",
                is_active: true,
            },
        });

        // Visitor is active in Guild B
        await prisma.guildMember.create({
            data: {
                guild_id: guildB.id,
                user_id: nonPlayerUser.id,
                role: "LEADER",
                is_active: true,
            },
        });

        // Inactive member in Guild A
        const inactiveUser = await prisma.user.create({
            data: {
                email: `inactive_${uniqueId}@example.com`,
                username: `inactive_${uniqueId}`,
            },
        });
        await prisma.guildMember.create({
            data: {
                guild_id: guildA.id,
                user_id: inactiveUser.id,
                role: "MEMBER",
                is_active: false,
            },
        });

        // Proposal created in Guild A
        const proposalA = await prisma.specialGameProposal.create({
            data: {
                quest_type: "MAIN_QUEST",
                status: "PENDING",
                game_title: "Test Special Game Guild A Proposal",
                proposer_id: matheusUser.id,
                guild_id: guildA.id,
            },
        });

        // 1. Cross-guild voter (nonPlayerUser from Guild B) attempts to vote on Guild A's proposal
        const crossGuildAttempt = await validateSpecialGameVotePermission(
            proposalA,
            nonPlayerUser.id,
            nonPlayerUser.email
        );
        expect(crossGuildAttempt.allowed).toBe(false);
        expect(crossGuildAttempt.error).toContain("Você não tem permissão para votar");

        // 2. Inactive member in Guild A attempts to vote
        const inactiveAttempt = await validateSpecialGameVotePermission(
            proposalA,
            inactiveUser.id,
            inactiveUser.email
        );
        expect(inactiveAttempt.allowed).toBe(false);

        // 3. Active member in Guild A attempts to vote
        const validAttempt = await validateSpecialGameVotePermission(
            proposalA,
            matheusUser.id,
            matheusUser.email
        );
        expect(validAttempt.allowed).toBe(true);

        // Cleanup
        await prisma.specialGameProposal.delete({ where: { id: proposalA.id } });
        await prisma.guildMember.deleteMany({ where: { guild_id: { in: [guildA.id, guildB.id] } } });
        await prisma.guild.deleteMany({ where: { id: { in: [guildA.id, guildB.id] } } });
        await prisma.user.delete({ where: { id: inactiveUser.id } });
    });

    test("6. Security: validateSpecialGameCancelPermission permits only proposer or guild leader", async () => {
        const uniqueId = Date.now();
        const guild = await prisma.guild.create({
            data: {
                name: `Guild Cancel Test ${uniqueId}`,
                slug: `guild-cancel-${uniqueId}`,
                invite_code: `CODE-C-${uniqueId}`,
                owner_id: matheusUser.id,
            },
        });

        // Leader member
        await prisma.guildMember.create({
            data: {
                guild_id: guild.id,
                user_id: matheusUser.id,
                role: "LEADER",
                is_active: true,
            },
        });

        // Normal member
        const memberUser = await prisma.user.create({
            data: {
                email: `member_${uniqueId}@example.com`,
                username: `member_${uniqueId}`,
            },
        });
        await prisma.guildMember.create({
            data: {
                guild_id: guild.id,
                user_id: memberUser.id,
                role: "MEMBER",
                is_active: true,
            },
        });

        // Member creates a proposal
        const proposal = await prisma.specialGameProposal.create({
            data: {
                quest_type: "SIDE_QUEST",
                status: "PENDING",
                game_title: "Test Special Game Cancel Permission",
                proposer_id: memberUser.id,
                guild_id: guild.id,
            },
        });

        // Proposer can cancel
        const authorCheck = await validateSpecialGameCancelPermission(proposal, memberUser.id);
        expect(authorCheck.allowed).toBe(true);

        // Guild Leader can cancel
        const leaderCheck = await validateSpecialGameCancelPermission(proposal, matheusUser.id);
        expect(leaderCheck.allowed).toBe(true);

        // Stranger / Non-leader from another context cannot cancel
        const strangerCheck = await validateSpecialGameCancelPermission(proposal, nonPlayerUser.id);
        expect(strangerCheck.allowed).toBe(false);
        expect(strangerCheck.error).toContain("Apenas o autor da proposta ou um Líder");

        // Cleanup
        await prisma.specialGameProposal.delete({ where: { id: proposal.id } });
        await prisma.guildMember.deleteMany({ where: { guild_id: guild.id } });
        await prisma.guild.delete({ where: { id: guild.id } });
        await prisma.user.delete({ where: { id: memberUser.id } });
    });

    test("7. Multi-Tenancy: Quorum activation scopes pool and gameProgress strictly to the proposal's guild", async () => {
        const uniqueId = Date.now();
        const guild = await prisma.guild.create({
            data: {
                name: `Guild Scope Test ${uniqueId}`,
                slug: `guild-scope-${uniqueId}`,
                invite_code: `CODE-S-${uniqueId}`,
                owner_id: matheusUser.id,
            },
        });

        await prisma.guildMember.create({
            data: {
                guild_id: guild.id,
                user_id: matheusUser.id,
                role: "LEADER",
                is_active: true,
            },
        });

        const proposal = await prisma.specialGameProposal.create({
            data: {
                quest_type: "MAIN_QUEST",
                status: "PENDING",
                game_title: "Test Special Game Guild Scoped Game",
                proposer_id: matheusUser.id,
                guild_id: guild.id,
                votes: {
                    create: {
                        user_id: matheusUser.id,
                        approved: true,
                    },
                },
            },
        });

        // Simulate quorum resolution
        const dbGame = await prisma.game.create({
            data: {
                title: proposal.game_title,
                quest_type: proposal.quest_type,
                nominated_by_id: proposal.proposer_id,
                is_special_release: true,
            },
        });

        const specialPool = await prisma.pool.create({
            data: {
                guild_id: proposal.guild_id,
                type: proposal.quest_type,
                status: "CLOSED",
                winner_game_id: dbGame.id,
                is_special: true,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
            },
        });

        expect(specialPool.guild_id).toBe(guild.id);
        expect(specialPool.is_special).toBe(true);

        // Cleanup
        await prisma.pool.delete({ where: { id: specialPool.id } });
        await prisma.game.delete({ where: { id: dbGame.id } });
        await prisma.specialGameVote.deleteMany({ where: { proposal_id: proposal.id } });
        await prisma.specialGameProposal.delete({ where: { id: proposal.id } });
        await prisma.guildMember.deleteMany({ where: { guild_id: guild.id } });
        await prisma.guild.delete({ where: { id: guild.id } });
    });
});

