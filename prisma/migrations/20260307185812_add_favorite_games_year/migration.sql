-- CreateTable
CREATE TABLE "_UserFavoritesYear" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserFavoritesYear_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserFavoritesYear_B_index" ON "_UserFavoritesYear"("B");

-- AddForeignKey
ALTER TABLE "_UserFavoritesYear" ADD CONSTRAINT "_UserFavoritesYear_A_fkey" FOREIGN KEY ("A") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoritesYear" ADD CONSTRAINT "_UserFavoritesYear_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
