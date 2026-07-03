-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "seoTitle" TEXT NOT NULL,
    "seoKeywords" TEXT NOT NULL DEFAULT '[]',
    "seoSchema" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "taskId" TEXT
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "audience" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaskLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_category_idx" ON "Article"("category");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");

-- CreateIndex
CREATE INDEX "TaskLog_taskId_idx" ON "TaskLog"("taskId");

-- CreateIndex
CREATE INDEX "TaskLog_timestamp_idx" ON "TaskLog"("timestamp");
