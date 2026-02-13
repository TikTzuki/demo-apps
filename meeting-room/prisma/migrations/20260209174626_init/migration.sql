-- CreateTable
CREATE TABLE "organizations"
(
    "id"          TEXT         NOT NULL,
    "name"        VARCHAR(200) NOT NULL,
    "description" TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_rooms"
(
    "id"              TEXT         NOT NULL,
    "name"            VARCHAR(200) NOT NULL,
    "capacity"        INTEGER      NOT NULL DEFAULT 0,
    "location"        VARCHAR(200),
    "organization_id" TEXT         NOT NULL,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings"
(
    "id"          TEXT         NOT NULL,
    "booker_name" VARCHAR(100) NOT NULL,
    "start_time"  TIMESTAMP(3) NOT NULL,
    "end_time"    TIMESTAMP(3) NOT NULL,
    "room_id"     TEXT         NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_room_id_start_time_end_time_idx" ON "bookings" ("room_id", "start_time", "end_time");

-- AddForeignKey
ALTER TABLE "meeting_rooms"
    ADD CONSTRAINT "meeting_rooms_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "meeting_rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
