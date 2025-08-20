-- CreateTable
CREATE TABLE "TraderSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pnlUsd" REAL NOT NULL,
    "roi" REAL NOT NULL,
    "winrate" REAL NOT NULL,
    "profitFactor" REAL NOT NULL,
    "sharpe" REAL NOT NULL,
    "trades" INTEGER NOT NULL,
    "uniqueTokens" INTEGER NOT NULL,
    "medianHoldH" REAL NOT NULL,
    "lowCapShare" REAL NOT NULL,
    "score" INTEGER NOT NULL,
    "flags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TraderSnapshot_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiscoveryRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiscoveryRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowDays" INTEGER NOT NULL DEFAULT 30,
    "minLiq" INTEGER NOT NULL DEFAULT 100000,
    "minFdv" INTEGER NOT NULL DEFAULT 10000000,
    "minPairAge" INTEGER NOT NULL DEFAULT 7,
    "minTrades" INTEGER NOT NULL DEFAULT 20,
    "minTokens" INTEGER NOT NULL DEFAULT 3
);
INSERT INTO "new_DiscoveryRun" ("createdAt", "id") SELECT "createdAt", "id" FROM "DiscoveryRun";
DROP TABLE "DiscoveryRun";
ALTER TABLE "new_DiscoveryRun" RENAME TO "DiscoveryRun";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TraderSnapshot_runId_idx" ON "TraderSnapshot"("runId");

-- CreateIndex
CREATE INDEX "TraderSnapshot_score_idx" ON "TraderSnapshot"("score");
