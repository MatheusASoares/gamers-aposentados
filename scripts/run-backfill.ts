import { backfillArtworks } from "../src/app/lib/backfill-art";

// Carrega as .env locais manualmente se o npx tsx não pegar do next
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
    await backfillArtworks();
    console.log("Backfill Finished");
    process.exit(0);
}

main();
