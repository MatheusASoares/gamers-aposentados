import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncProductionData() {
    console.log("Starting production data sync...");

    try {
        // 1. Fix March 2026 Side Quest (Matheus games & Blasphemous/Moonlighter images)
        console.log("Fixing March 2026 Side Quest Nominations...");
        const matheus = await prisma.user.findFirst({ where: { name: "Matheus" } });
        if (matheus) {
            const gamesToTransfer = [
                "Shadow of the Colossus",
                "Guacamelee!",
                "Brothers: A Tale of Two Sons"
            ];
            
            for (const gameTitle of gamesToTransfer) {
                const game = await prisma.game.findFirst({ where: { title: gameTitle } });
                if (game) {
                    await prisma.game.update({
                        where: { id: game.id },
                        data: { nominated_by_id: matheus.id }
                    });
                }
            }
        }

        console.log("Updating Blasphemous images...");
        const blasphemous = await prisma.game.findFirst({ where: { title: "Blasphemous" } });
        if (blasphemous) {
            await prisma.game.update({
                where: { id: blasphemous.id },
                data: {
                    cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1qze.jpg",
                    artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar4dtt.jpg"
                }
            });
        }

        console.log("Updating Moonlighter images...");
        const moonlighter = await prisma.game.findFirst({ where: { title: "Moonlighter" } });
        if (moonlighter) {
            await prisma.game.update({
                where: { id: moonlighter.id },
                data: {
                    cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2k0x.jpg",
                    artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar56v.jpg"
                }
            });
        }

        // 2. Fix Final Fantasy VII Remake
        console.log("Updating Final Fantasy VII Remake images...");
        const ff7r = await prisma.game.findFirst({ where: { title: "Final Fantasy VII Remake" } });
        if (ff7r) {
            await prisma.game.update({
                where: { id: ff7r.id },
                data: {
                    cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1qyp.jpg",
                    artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar3rhi.jpg"
                }
            });
        }

        // 3. Fix Streets of Rage 4
        console.log("Updating Streets of Rage 4 images...");
        const sor4 = await prisma.game.findFirst({ where: { title: "Streets of Rage 4" } });
        if (sor4) {
            await prisma.game.update({
                where: { id: sor4.id },
                data: {
                    artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar42x4.jpg"
                }
            });
        }

        // 4. Fix Disco Elysium
        console.log("Updating Disco Elysium images...");
        const disco = await prisma.game.findFirst({ where: { title: "Disco Elysium" } });
        if (disco) {
            await prisma.game.update({
                where: { id: disco.id },
                data: {
                    artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar4pd7.png" // transparent logo
                }
            });
        }

        // 5. Fix Death Stranding 1
        console.log("Updating Death Stranding images...");
        const ds1 = await prisma.game.findFirst({ where: { title: "Death Stranding 1" } });
        if (ds1) {
            await prisma.game.update({
                where: { id: ds1.id },
                data: {
                    artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar3s0u.jpg"
                }
            });
        }

        // 6. Fix Ghostwire: Tokyo
        console.log("Updating Ghostwire: Tokyo...");
        const ghostwire = await prisma.game.findFirst({ where: { id: "7d8aab68-2e3a-447e-9e19-09ec73a9d9d2" } }); // ID found earlier
        if (ghostwire) {
             await prisma.game.update({
                 where: { id: ghostwire.id },
                 data: {
                     title: "Ghostwire: Tokyo",
                     cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co55xn.jpg",
                     artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar5qk.jpg"
                 }
             });
        }

        // 7. Fix The Witcher 3: Wild Hunt
        console.log("Updating The Witcher 3: Wild Hunt...");
        const witcher = await prisma.game.findFirst({ where: { id: "e38e0d1a-e4b2-4d0d-8ad0-8c53faa64a02" } }); // ID found earlier
        if (witcher) {
            await prisma.game.update({
                where: { id: witcher.id },
                data: {
                    title: "The Witcher 3: Wild Hunt",
                    cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/coaarl.jpg",
                    artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar3lzh.jpg"
                }
            });
        }

        // 8. Fix Batman: Arkham Knight
        console.log("Updating Batman: Arkham Knight...");
        const batman = await prisma.game.findFirst({ where: { id: "8ee27090-8b41-44dd-ad77-787d38a945a8" } }); // ID found earlier
        if (batman) {
            await prisma.game.update({
                where: { id: batman.id },
                data: {
                    title: "Batman: Arkham Knight",
                    cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/coagib.jpg",
                    artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar5n3.jpg"
                }
            });
        }

        // 9. Fix Prince of Persia: The Sands of Time (Lucas Winner)
        console.log("Updating Prince of Persia...");
        const popId = "0f2a378f-a686-4741-a42b-d93439f2de9a"; // ID found earlier
        const pop = await prisma.game.findFirst({ where: { id: popId } });
        if (pop) {
             await prisma.game.update({
                where: { id: pop.id },
                data: {
                    title: "Prince of Persia: The Sands of Time",
                    cover_url: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4t8l.jpg",
                    artwork_url: "https://images.igdb.com/igdb/image/upload/t_1080p/ar8c5.jpg"
                }
            });
        }

        console.log("🎉 Production Data Sync Completed Successfully!");

    } catch (error) {
        console.error("Error syncing production data:", error);
    }
}

syncProductionData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
