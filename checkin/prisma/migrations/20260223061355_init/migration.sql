-- CreateTable
CREATE TABLE "teams"
(
    "id"         TEXT         NOT NULL,
    "name"       VARCHAR(200) NOT NULL,
    "color"      VARCHAR(50)  NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members"
(
    "id"            TEXT         NOT NULL,
    "name"          VARCHAR(200) NOT NULL,
    "email"         VARCHAR(200),
    "checked_in"    BOOLEAN      NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMP(3),
    "team_id"       TEXT         NOT NULL,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "members"
    ADD CONSTRAINT "members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
