-- CreateTable
CREATE TABLE "lixi_sessions"
(
    "id"         TEXT         NOT NULL,
    "total"      INTEGER      NOT NULL,
    "amounts"    INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lixi_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lixi_spins"
(
    "id"          TEXT         NOT NULL,
    "session_id"  TEXT         NOT NULL,
    "player_name" VARCHAR(200) NOT NULL,
    "amount"      INTEGER      NOT NULL,
    "spin_order"  INTEGER      NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lixi_spins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lixi_spins_session_id_player_name_key" ON "lixi_spins" ("session_id", "player_name");

-- AddForeignKey
ALTER TABLE "lixi_spins"
    ADD CONSTRAINT "lixi_spins_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "lixi_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
