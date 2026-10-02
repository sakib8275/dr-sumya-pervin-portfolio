-- Phase 2 booking tiers (Change Request 2026-10-02, docx §5.40).
--
-- The multi-page /book/ form lets a patient choose the depth of the first visit
-- (Specialist / Comprehensive / Signature / Procedure Assessment / Private) and
-- a preferred session. Both are optional: the incumbent one-pager does not send
-- them, so old rows keep '' and every existing query is unaffected.

ALTER TABLE appointments ADD COLUMN consultation_type TEXT DEFAULT '';
ALTER TABLE appointments ADD COLUMN preferred_session TEXT DEFAULT '';
