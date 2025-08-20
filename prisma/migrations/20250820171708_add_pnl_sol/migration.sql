-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TraderSnapshot" (
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
    "pnlSol" REAL DEFAULT 0,
    CONSTRAINT "TraderSnapshot_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DiscoveryRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TraderSnapshot" ("address", "createdAt", "flags", "id", "lowCapShare", "medianHoldH", "pnlSol", "pnlUsd", "profitFactor", "roi", "runId", "score", "sharpe", "trades", "uniqueTokens", "winrate") SELECT "address", "createdAt", "flags", "id", "lowCapShare", "medianHoldH", "pnlSol", "pnlUsd", "profitFactor", "roi", "runId", "score", "sharpe", "trades", "uniqueTokens", "winrate" FROM "TraderSnapshot";
DROP TABLE "TraderSnapshot";
ALTER TABLE "new_TraderSnapshot" RENAME TO "TraderSnapshot";
CREATE INDEX "TraderSnapshot_runId_idx" ON "TraderSnapshot"("runId");
CREATE INDEX "TraderSnapshot_score_idx" ON "TraderSnapshot"("score");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
