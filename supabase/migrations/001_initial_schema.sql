-- ============================================================
-- 001_initial_schema.sql
-- Tables: users, polls, options, matchups, votes
-- ============================================================

-- Plan enum
create type public.plan as enum ('free', 'pro');

-- ============================================================
-- users
-- Mirror of auth.users with app-specific profile columns.
-- Populated via a trigger on auth.users insert.
-- ============================================================
create table public.users (
  id           uuid        primary key references auth.users (id) on delete cascade,
  email        text        not null,
  display_name text,
  avatar_url   text,
  plan         public.plan not null default 'free',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- Sync new auth users into public.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- polls
-- ============================================================
create table public.polls (
  id           uuid        primary key default gen_random_uuid(),
  short_id     text        not null unique,
  creator_id   uuid        not null references public.users (id) on delete cascade,
  question     text        not null,
  closes_at    timestamptz,             -- null = no expiry override
  published_at timestamptz,             -- null = draft; set = live
  closed_at    timestamptz,             -- null = accepting votes; set = manually closed
  deleted_at   timestamptz,             -- soft delete
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index polls_short_id_idx on public.polls (short_id);
create index polls_creator_id_idx on public.polls (creator_id);

create trigger polls_updated_at
  before update on public.polls
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- options
-- ============================================================
create table public.options (
  id         uuid        primary key default gen_random_uuid(),
  poll_id    uuid        not null references public.polls (id) on delete cascade,
  label      text,
  image_url  text,
  position   integer     not null,     -- display/seed order (0-indexed)
  created_at timestamptz not null default now(),
  constraint options_has_label_or_image check (label is not null or image_url is not null)
);

create index options_poll_id_idx on public.options (poll_id);

-- ============================================================
-- matchups
-- One matchup per A/B round. MVP: every poll has exactly 1.
-- ============================================================
create table public.matchups (
  id          uuid        primary key default gen_random_uuid(),
  poll_id     uuid        not null references public.polls (id) on delete cascade,
  round       integer     not null default 1,
  option_a_id uuid        references public.options (id) on delete set null,
  option_b_id uuid        references public.options (id) on delete set null,
  winner_id   uuid        references public.options (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index matchups_poll_id_idx on public.matchups (poll_id);

-- ============================================================
-- votes
-- One row per cast vote. Dedup enforced by UNIQUE on
-- (matchup_id, fingerprint) — composite hash of visitorId + hashedIP + pollId.
-- ============================================================
create table public.votes (
  id          uuid        primary key default gen_random_uuid(),
  poll_id     uuid        not null references public.polls (id) on delete cascade,
  option_id   uuid        not null references public.options (id) on delete cascade,
  matchup_id  uuid        not null references public.matchups (id) on delete cascade,
  voter_name  text,                     -- optional, post-vote prompt
  fingerprint text        not null,     -- hash(visitorId + hashedIP + pollId)
  created_at  timestamptz not null default now(),
  constraint votes_unique_fingerprint unique (matchup_id, fingerprint)
);

create index votes_poll_id_idx    on public.votes (poll_id);
create index votes_option_id_idx  on public.votes (option_id);
create index votes_matchup_id_idx on public.votes (matchup_id);
