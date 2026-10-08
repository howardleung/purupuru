-- Add the app-owned public profile fields without changing Clerk-owned identity data.
ALTER TABLE "User"
ADD COLUMN "sensitiveSkin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "selectedAvatarId" TEXT;

-- Preserve the intent of legacy skin-type values while moving Sensitive to an
-- independent characteristic. The enum values remain for migration compatibility,
-- but new application writes accept only the four primary skin types.
UPDATE "User"
SET "sensitiveSkin" = true, "skinType" = NULL
WHERE "skinType" = 'SENSITIVE';

UPDATE "User"
SET "skinType" = NULL
WHERE "skinType" = 'NOT_SURE';

CREATE TABLE "ProfileAvatar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetPath" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileAvatar_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileAvatar_assetPath_key" ON "ProfileAvatar"("assetPath");
CREATE INDEX "User_selectedAvatarId_idx" ON "User"("selectedAvatarId");

INSERT INTO "ProfileAvatar" ("id", "name", "assetPath", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
('purupuru-drop', 'Puru Drop', '/avatars/purupuru-drop.svg', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dewy-peach', 'Dewy Peach', '/avatars/dewy-peach.svg', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('calm-cloud', 'Calm Cloud', '/avatars/calm-cloud.svg', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('green-tea', 'Green Tea', '/avatars/green-tea.svg', 40, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sunny-day', 'Sunny Day', '/avatars/sunny-day.svg', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "User"
ADD CONSTRAINT "User_selectedAvatarId_fkey"
FOREIGN KEY ("selectedAvatarId") REFERENCES "ProfileAvatar"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
