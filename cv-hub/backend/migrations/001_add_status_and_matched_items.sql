-- Migration: Add status column to CVs and matched_items column to CV-JD matches
-- Run: psql -U postgres -d cv_hub -f migrations/001_add_status_and_matched_items.sql

-- Add status column to CVs (pending/passed/failed)
ALTER TABLE cvs
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';

-- Add matched_items column to CV-JD matches (JSON string of requirement breakdown)
ALTER TABLE cv_jd_matches
    ADD COLUMN IF NOT EXISTS matched_items TEXT;
