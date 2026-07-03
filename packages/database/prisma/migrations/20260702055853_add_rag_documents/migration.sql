-- CreateTable
CREATE TABLE "RagDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RagDocument_title_idx" ON "RagDocument"("title");

-- CreateIndex
CREATE INDEX "RagDocument_category_idx" ON "RagDocument"("category");
