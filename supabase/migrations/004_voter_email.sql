-- ============================================================
-- 004_voter_email.sql
-- Add voter_email column to votes table.
-- ============================================================

alter table public.votes add column voter_email text;
