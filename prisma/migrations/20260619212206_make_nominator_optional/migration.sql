-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_nominated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "pool_entries" DROP CONSTRAINT "pool_entries_game_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_game_id_fkey";

-- AlterTable
ALTER TABLE "games" ALTER COLUMN "nominated_by_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_nominated_by_id_fkey" FOREIGN KEY ("nominated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_entries" ADD CONSTRAINT "pool_entries_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
