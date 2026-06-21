-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "campaign_contracts" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "daily_atomic_quest" TEXT NOT NULL,
    "progress_percentage" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_contract_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'LOCKED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_contract_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_contracts_game_id_sequence_order_key" ON "campaign_contracts"("game_id", "sequence_order");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_contract_progress_user_id_contract_id_key" ON "campaign_contract_progress"("user_id", "contract_id");

-- AddForeignKey
ALTER TABLE "campaign_contracts" ADD CONSTRAINT "campaign_contracts_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_contract_progress" ADD CONSTRAINT "campaign_contract_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_contract_progress" ADD CONSTRAINT "campaign_contract_progress_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "campaign_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
