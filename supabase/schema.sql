-- SourceGuard Labeling Arena — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) before seeding.

create extension if not exists "pgcrypto";

create table if not exists source_pairs (
  id uuid primary key default gen_random_uuid(),
  research_task text not null,

  source_a_id text not null,
  source_a_url text not null,
  source_a_title text,
  source_a_capsule text,
  source_a_source_type text,
  source_a_author_transparency text,
  source_a_citation_quality text,
  source_a_evidence_quality text,
  source_a_commercial_pressure text,
  source_a_risk_tags jsonb default '[]',
  source_a_machine_score int,

  source_b_id text not null,
  source_b_url text not null,
  source_b_title text,
  source_b_capsule text,
  source_b_source_type text,
  source_b_author_transparency text,
  source_b_citation_quality text,
  source_b_evidence_quality text,
  source_b_commercial_pressure text,
  source_b_risk_tags jsonb default '[]',
  source_b_machine_score int,

  machine_preferred_source text,
  machine_reason text,

  created_at timestamp with time zone default now()
);

create table if not exists annotations (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid references source_pairs(id) on delete cascade,

  human_preferred_source text not null,
  source_a_would_cite text not null,
  source_b_would_cite text not null,
  selected_risk_tags jsonb default '[]',
  reason text,

  annotator_session_id text,
  user_agent text,

  created_at timestamp with time zone default now()
);

create index if not exists idx_annotations_pair_id on annotations(pair_id);
create index if not exists idx_source_pairs_created_at on source_pairs(created_at);

-- Row Level Security: the app only talks to Supabase via the service role key on the
-- server, so RLS can stay enabled with no public policies. The anon key is unused for
-- writes in this app, but is kept available for future read-only client use cases.
alter table source_pairs enable row level security;
alter table annotations enable row level security;

-- Single-claim Fin-Fact-derived Terac flow. Public task records intentionally
-- contain no original Fin-Fact label, explanation, verdict, or issue field.
create table if not exists source_claim_tasks (
  id uuid primary key default gen_random_uuid(),
  task_id text unique not null,
  task_type text not null,
  research_task text not null,
  claim text not null,
  author text,
  posted_date text,
  source text,
  evidence_text text,
  evidence_url text,
  image_url text,
  capsule text,
  created_at timestamp with time zone default now()
);

create table if not exists claim_annotations (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references source_claim_tasks(task_id) on delete cascade,
  human_verdict text not null check (human_verdict in ('supported', 'questionable', 'unsupported', 'insufficient_info')),
  would_ai_cite text not null check (would_ai_cite in ('yes', 'no', 'caution')),
  risk_tags jsonb not null default '[]',
  reason text not null,
  annotator_session_id text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_claim_annotations_task_id on claim_annotations(task_id);
alter table source_claim_tasks enable row level security;
alter table claim_annotations enable row level security;
