-- The business day now ends at midnight rather than 05:00.
--
-- Consequence: a session stops accruing minutes at the end of its own business
-- day, so overtime is bounded by ot_start_time → 24:00 (six hours by default).
-- Work continuing past midnight belongs to the next business day.
--
-- This changes how ALREADY-RECORDED days are calculated, because minutes are
-- derived on read rather than stored. Any shift that previously ran past
-- midnight will report fewer overtime minutes than before.

ALTER TABLE "attendance_settings"
    ALTER COLUMN "day_cutoff_hour" SET DEFAULT 0;

UPDATE "attendance_settings"
SET "day_cutoff_hour" = 0,
    "updated_at"      = now()
WHERE "day_cutoff_hour" = 5;
