ALTER TABLE "RefreshToken"
ADD COLUMN "familyId" TEXT,
ADD COLUMN "replacedByTokenHash" TEXT;

UPDATE "RefreshToken"
SET "familyId" = 'legacy-' || "id"
WHERE "familyId" IS NULL;

ALTER TABLE "RefreshToken"
ALTER COLUMN "familyId" SET NOT NULL;

CREATE INDEX "RefreshToken_familyId_idx"
ON "RefreshToken"("familyId");
