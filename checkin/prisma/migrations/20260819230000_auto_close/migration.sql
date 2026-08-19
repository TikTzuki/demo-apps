-- Auto-closing forgotten sessions.
--
-- A session left open past the cutoff of its own business day is closed by the
-- system at a defensible time (end of the normal shift, or the day cutoff for a
-- night shift) rather than left at zero hours. Both columns are nullable, so
-- every existing row keeps its meaning: closed by a person, already reviewed.

ALTER TABLE "attendance_sessions"
    ADD COLUMN "auto_closed_at" TIMESTAMP(3),
    ADD COLUMN "reviewed_at"    TIMESTAMP(3);

-- The admin review queue is "auto-closed and not yet reviewed" — index it.
CREATE INDEX "attendance_sessions_review_idx"
    ON "attendance_sessions" ("auto_closed_at")
    WHERE "auto_closed_at" IS NOT NULL AND "reviewed_at" IS NULL;
