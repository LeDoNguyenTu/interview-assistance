create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  mode text not null check (mode in ('coach', 'interviewer', 'defense')),
  platform text not null check (platform in ('web', 'desktop')),
  provider text not null check (provider in ('gemini', 'openai', 'fixture')),
  status text not null check (
    status in (
      'draft',
      'ready',
      'capturing',
      'interrupted',
      'processing',
      'completed',
      'failed'
    )
  ),
  capture_sources text[] not null default '{}'::text[] check (
    capture_sources <@ array['microphone', 'browser-tab', 'system-audio', 'upload']::text[]
  ),
  recording_enabled boolean not null default false,
  title text not null check (length(trim(title)) > 0 and length(title) <= 160),
  consent_version text,
  consented_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (consent_version is null and consented_at is null)
    or (consent_version is not null and consented_at is not null)
  ),
  check (ended_at is null or started_at is null or ended_at >= started_at)
);

create index if not exists sessions_user_id_created_at_idx
  on public.sessions (user_id, created_at desc);
