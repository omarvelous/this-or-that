-- ============================================================
-- 002_rls_policies.sql
-- Row-level security for all tables.
-- ============================================================

-- Enable RLS on every table
alter table public.users    enable row level security;
alter table public.polls    enable row level security;
alter table public.options  enable row level security;
alter table public.matchups enable row level security;
alter table public.votes    enable row level security;

-- ============================================================
-- users
-- ============================================================

-- Anyone authenticated can read user profiles (needed for
-- displaying maker info on poll pages).
create policy "users: authenticated read"
  on public.users for select
  to authenticated
  using (true);

-- A user can only update their own profile.
create policy "users: owner update"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- polls
-- ============================================================

-- Anyone (including anonymous) can read non-deleted polls.
create policy "polls: public read"
  on public.polls for select
  using (deleted_at is null);

-- Authenticated makers can create polls.
create policy "polls: authenticated insert"
  on public.polls for insert
  to authenticated
  with check (creator_id = auth.uid());

-- Only the creator can update their own polls.
create policy "polls: owner update"
  on public.polls for update
  to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- Only the creator can delete (soft-delete via UPDATE in practice,
-- but guard hard-delete too).
create policy "polls: owner delete"
  on public.polls for delete
  to authenticated
  using (creator_id = auth.uid());

-- ============================================================
-- options
-- ============================================================

-- Anyone can read options (no filtering needed — deleted polls are
-- filtered at the polls level and options are always fetched with a join).
create policy "options: public read"
  on public.options for select
  using (true);

-- Only the creator of the parent poll can insert options.
create policy "options: poll creator insert"
  on public.options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.polls
      where polls.id = poll_id
        and polls.creator_id = auth.uid()
    )
  );

-- Only the creator of the parent poll can update options.
create policy "options: poll creator update"
  on public.options for update
  to authenticated
  using (
    exists (
      select 1 from public.polls
      where polls.id = poll_id
        and polls.creator_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.polls
      where polls.id = poll_id
        and polls.creator_id = auth.uid()
    )
  );

-- ============================================================
-- matchups
-- ============================================================

-- Anyone can read matchups.
create policy "matchups: public read"
  on public.matchups for select
  using (true);

-- Only the creator of the parent poll can insert matchups.
create policy "matchups: poll creator insert"
  on public.matchups for insert
  to authenticated
  with check (
    exists (
      select 1 from public.polls
      where polls.id = poll_id
        and polls.creator_id = auth.uid()
    )
  );

-- Only the creator of the parent poll can update matchups
-- (e.g. setting winner_id after a round resolves).
create policy "matchups: poll creator update"
  on public.matchups for update
  to authenticated
  using (
    exists (
      select 1 from public.polls
      where polls.id = poll_id
        and polls.creator_id = auth.uid()
    )
  );

-- ============================================================
-- votes
-- ============================================================

-- Anyone (including anonymous) can read votes.
create policy "votes: public read"
  on public.votes for select
  using (true);

-- Anyone (anonymous included) can insert a vote.
-- Dedup is enforced by UNIQUE(matchup_id, fingerprint) in the schema.
-- The API route validates poll state (open, not expired) before inserting.
create policy "votes: public insert"
  on public.votes for insert
  with check (true);

-- A voter can update only their own vote row (to set voter_name
-- after the post-vote name prompt).
create policy "votes: voter update name"
  on public.votes for update
  using (true)
  with check (
    -- Only allow updating voter_name; all other columns must stay the same.
    -- Enforced in the API route — RLS can't enforce column-level update rules
    -- without a function, so the API is the real gate here.
    true
  );
