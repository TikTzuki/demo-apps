-- Daily attendance & overtime tracking.
-- Replaces the single-boolean hackathon check-in with check-in/check-out session rows.

-- 1. New tables ---------------------------------------------------------------

CREATE TABLE "admin_users"
(
    "id"            TEXT         NOT NULL,
    "email"         VARCHAR(200) NOT NULL,
    "name"          VARCHAR(200) NOT NULL,
    "password_hash" TEXT         NOT NULL,
    "role"          VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',
    "is_active"     BOOLEAN      NOT NULL DEFAULT true,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users" ("email");

CREATE TABLE "attendance_sessions"
(
    "id"           TEXT         NOT NULL,
    "member_id"    TEXT         NOT NULL,
    "work_date"    DATE         NOT NULL,
    "check_in_at"  TIMESTAMP(3) NOT NULL,
    "check_out_at" TIMESTAMP(3),
    "kind"         VARCHAR(20)  NOT NULL DEFAULT 'DAY',
    "note"         VARCHAR(500),
    "is_manual"    BOOLEAN      NOT NULL DEFAULT false,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "attendance_sessions_member_id_work_date_idx" ON "attendance_sessions" ("member_id", "work_date");
CREATE INDEX "attendance_sessions_work_date_idx" ON "attendance_sessions" ("work_date");

ALTER TABLE "attendance_sessions"
    ADD CONSTRAINT "attendance_sessions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "attendance_settings"
(
    "id"                      TEXT         NOT NULL DEFAULT 'default',
    "timezone_offset_minutes" INTEGER      NOT NULL DEFAULT 420,
    "day_cutoff_hour"         INTEGER      NOT NULL DEFAULT 5,
    "shift_start_time"        VARCHAR(5)   NOT NULL DEFAULT '08:00',
    "late_after_time"         VARCHAR(5)   NOT NULL DEFAULT '10:00',
    "ot_start_time"           VARCHAR(5)   NOT NULL DEFAULT '18:00',
    "overnight_start_time"    VARCHAR(5)   NOT NULL DEFAULT '21:00',
    "standard_shift_minutes"  INTEGER      NOT NULL DEFAULT 480,
    "break_minutes"           INTEGER      NOT NULL DEFAULT 90,
    "break_start_time"        VARCHAR(5)   NOT NULL DEFAULT '12:00',
    "ot_min_minutes"          INTEGER      NOT NULL DEFAULT 30,
    "max_session_hours"       INTEGER      NOT NULL DEFAULT 16,
    "updated_at"              TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_settings_pkey" PRIMARY KEY ("id")
);

-- 2. Member columns -----------------------------------------------------------

ALTER TABLE "members"
    ADD COLUMN "employee_code" VARCHAR(50),
    ADD COLUMN "is_active"     BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "members_employee_code_key" ON "members" ("employee_code");

-- 3. Backfill BEFORE dropping the old boolean ---------------------------------
-- Local time = UTC + 7h (Asia/Ho_Chi_Minh, no DST). Business day starts at 05:00
-- local, so work_date = date(local_time - 5h) = date(check_in_at + 2h).

INSERT INTO "attendance_sessions" ("id", "member_id", "work_date", "check_in_at", "kind", "note", "is_manual",
                                   "created_at", "updated_at")
SELECT gen_random_uuid()::text,
       "id",
       ("checked_in_at" + INTERVAL '2 hours')::date,
       "checked_in_at",
       -- Matches classifyKind() in src/lib/attendance/compute.ts: a night shift is
       -- one starting at/after 21:00, or in the small hours before the 05:00 cutoff.
       CASE
           WHEN EXTRACT(HOUR FROM ("checked_in_at" + INTERVAL '7 hours')) >= 21
               OR EXTRACT(HOUR FROM ("checked_in_at" + INTERVAL '7 hours')) < 5 THEN 'OVERNIGHT'
           ELSE 'DAY'
           END,
       'Chuyển đổi từ dữ liệu check-in cũ',
       true,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "members"
WHERE "checked_in" = true
  AND "checked_in_at" IS NOT NULL;

-- 4. Drop the superseded boolean ----------------------------------------------

ALTER TABLE "members"
    DROP COLUMN "checked_in",
    DROP COLUMN "checked_in_at";

-- 5. Remove the Lì Xì feature -------------------------------------------------

DROP TABLE IF EXISTS "lixi_spins";
DROP TABLE IF EXISTS "lixi_sessions";
