-- CreateTable
CREATE TABLE "discord_channels"
(
    "id"              TEXT         NOT NULL,
    "channel_id"      VARCHAR(100) NOT NULL,
    "guild_id"        VARCHAR(100) NOT NULL,
    "guild_name"      VARCHAR(200),
    "organization_id" TEXT         NOT NULL,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_channels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discord_channels_channel_id_organization_id_key" ON "discord_channels" ("channel_id", "organization_id");

-- AddForeignKey
ALTER TABLE "discord_channels"
    ADD CONSTRAINT "discord_channels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
