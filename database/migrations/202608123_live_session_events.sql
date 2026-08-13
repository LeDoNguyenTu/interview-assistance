create table if not exists public.utterances (
  id text primary key,
  user_id text not null,
  session_id uuid not null references public.sessions(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  speaker text not null check (speaker in ('interviewer', 'interviewee', 'unknown')),
  text text not null check (length(trim(text)) > 0 and length(text) <= 12000),
  start_ms integer not null check (start_ms >= 0),
  end_ms integer not null check (end_ms >= start_ms),
  confidence double precision check (confidence between 0 and 1),
  is_final boolean not null default true check (is_final),
  created_at timestamptz not null default now(),
  unique (session_id, sequence)
);

create index if not exists utterances_user_session_sequence_idx
  on public.utterances (user_id, session_id, sequence);

create table if not exists public.questions (
  id text primary key,
  user_id text not null,
  session_id uuid not null references public.sessions(id) on delete cascade,
  source_utterance_id text not null references public.utterances(id) on delete cascade,
  text text not null check (length(trim(text)) > 0 and length(text) <= 4000),
  context text,
  confidence double precision check (confidence between 0 and 1),
  detected_ms integer not null check (detected_ms >= 0),
  created_at timestamptz not null default now(),
  unique (session_id, source_utterance_id)
);

create index if not exists questions_user_session_created_at_idx
  on public.questions (user_id, session_id, created_at);

create table if not exists public.session_notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_id uuid not null references public.sessions(id) on delete cascade,
  idempotency_key text not null check (length(idempotency_key) between 1 and 160),
  body text not null check (length(trim(body)) > 0 and length(body) <= 4000),
  created_at timestamptz not null default now(),
  unique (session_id, idempotency_key)
);

create index if not exists session_notes_user_session_created_at_idx
  on public.session_notes (user_id, session_id, created_at);

create table if not exists public.guidance_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_id uuid not null references public.sessions(id) on delete cascade,
  idempotency_key text not null check (length(idempotency_key) between 1 and 160),
  provider text not null check (provider in ('openai', 'gemini')),
  result_text text not null check (length(trim(result_text)) > 0 and length(result_text) <= 12000),
  created_at timestamptz not null default now(),
  unique (session_id, idempotency_key)
);

create index if not exists guidance_events_user_session_created_at_idx
  on public.guidance_events (user_id, session_id, created_at);
