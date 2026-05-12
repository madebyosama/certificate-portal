-- ============================================================================
-- Migration: Per-candidate payment tracking
-- ============================================================================
-- Adds payment tracking to individual candidates so that:
--   * A course can be purchased (paying the one-time purchase_fee) before any
--     student is added.
--   * Students can be added/edited/deleted while they are still unpaid.
--   * Once a student is paid for they can no longer be deleted (only edited)
--     and become eligible for certificate download / hard-copy order.
--   * Adding more students after the initial purchase only charges for the
--     newly-added (still unpaid) students — previously paid students are
--     never re-billed.
-- ============================================================================

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Back-fill: any candidate that belongs to a course already marked `approved`
-- predates this migration, so treat them as already-paid.
UPDATE candidates c
SET    paid    = true,
       paid_at = COALESCE(c.paid_at, now())
FROM   courses co
WHERE  c.course_id = co.id
  AND  co.status   = 'approved'
  AND  c.paid     = false;

-- Optional: helpful index for the common "fetch unpaid candidates in course"
-- query used by the new purchase screen.
CREATE INDEX IF NOT EXISTS candidates_course_paid_idx
  ON candidates (course_id, paid);
