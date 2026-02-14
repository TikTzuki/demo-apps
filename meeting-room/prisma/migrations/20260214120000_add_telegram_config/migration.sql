-- AlterTable: add tag column (nullable first for existing rows)
ALTER TABLE "organizations"
    ADD COLUMN "tag" VARCHAR(50);

-- Backfill: generate tags from existing org names (lowercase, strip non-alphanumeric)
UPDATE "organizations"
SET "tag" = lower(regexp_replace("name", '[^a-zA-Z0-9]', '', 'g'))
WHERE "tag" IS NULL;

-- Ensure no empty tags after backfill
UPDATE "organizations"
SET "tag" = "id"
WHERE "tag" IS NULL
   OR "tag" = '';

-- Make tag NOT NULL and UNIQUE
ALTER TABLE "organizations"
    ALTER COLUMN "tag" SET NOT NULL;
CREATE UNIQUE INDEX "organizations_tag_key" ON "organizations" ("tag");

-- Drop old telegram columns if they exist
ALTER TABLE "organizations"
    DROP COLUMN IF EXISTS "telegram_bot_token";
ALTER TABLE "organizations"
    DROP COLUMN IF EXISTS "telegram_chat_id";

-- CreateTable
CREATE TABLE "telegram_groups"
(
    "id"              TEXT         NOT NULL,
    "chat_id"         VARCHAR(100) NOT NULL,
    "chat_title"      VARCHAR(200),
    "organization_id" TEXT         NOT NULL,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_groups_chat_id_organization_id_key" ON "telegram_groups" ("chat_id", "organization_id");

-- AddForeignKey
ALTER TABLE "telegram_groups"
    ADD CONSTRAINT "telegram_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
