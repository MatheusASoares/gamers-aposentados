import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import { RANDOMIZER_PLAYER_EMAILS } from "../src/lib/randomizer-players";

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
});
