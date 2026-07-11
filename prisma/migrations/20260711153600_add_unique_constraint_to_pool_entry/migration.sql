-- CreateIndex
CREATE UNIQUE INDEX "pool_entries_pool_id_game_id_key" ON "pool_entries"("pool_id", "game_id");
