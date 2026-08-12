create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create table public.profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  locale text not null default 'en',
  default_provider text not null default 'fixture' check (default_provider in ('gemini', 'openai', 'fixture')),
  retention_days integer not null default 30 check (retention_days between 1 and 3650),
  recording_default boolean not null default false,
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique check (storage_path like user_id::text || '/%'),
  original_filename text not null check (length(original_filename) > 0),
  media_type text not null check (length(media_type) > 0),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  extracted_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interview_profiles (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) > 0),
  target_role text,
  company_context text,
  instructions text,
  document_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interview_profile_id uuid references public.interview_profiles(id) on delete set null,
  mode text not null check (mode in ('coach', 'interviewer', 'defense')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'capturing', 'interrupted', 'processing', 'completed', 'failed')),
  provider text not null default 'fixture' check (provider in ('gemini', 'openai', 'fixture')),
  platform text not null check (platform in ('web', 'desktop')),
  capture_sources text[] not null default '{}'::text[] check (capture_sources <@ array['microphone', 'browser-tab', 'system-audio', 'upload']::text[]),
  recording_enabled boolean not null default false,
  title text not null check (length(title) > 0),
  consent_version text,
  consented_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((consent_version is null and consented_at is null) or (consent_version is not null and consented_at is not null)),
  check (ended_at is null or started_at is null or ended_at >= started_at)
);

create table public.recordings (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  source text not null check (source in ('microphone', 'browser-tab', 'system-audio', 'upload')),
  storage_path text not null unique check (storage_path like user_id::text || '/%'),
  media_type text not null check (length(media_type) > 0),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 1073741824),
  duration_ms bigint not null default 0 check (duration_ms >= 0),
  checksum text,
  upload_status text not null default 'pending' check (upload_status in ('pending', 'uploading', 'uploaded', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.utterances (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  speaker text not null check (speaker in ('candidate', 'interviewer', 'assistant', 'system')),
  text text not null default '',
  start_ms bigint not null check (start_ms >= 0),
  end_ms bigint not null check (end_ms >= start_ms),
  is_final boolean not null default false,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, sequence)
);

create table public.questions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  source_utterance_ids uuid[] not null default '{}'::uuid[],
  text text not null check (length(text) > 0),
  context text,
  detected_ms bigint not null check (detected_ms >= 0),
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guidance_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  provider text not null check (provider in ('gemini', 'openai', 'fixture')),
  model text not null check (length(model) > 0),
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  latency_ms integer not null check (latency_ms >= 0),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  idempotency_key text not null check (length(idempotency_key) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, idempotency_key)
);

create table public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  report_type text not null check (report_type in ('summary', 'feedback', 'defense-analysis')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  schema_version text not null check (length(schema_version) > 0),
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  idempotency_key text not null check (length(idempotency_key) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, idempotency_key)
);

create table public.usage_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  provider text not null check (provider in ('gemini', 'openai', 'fixture')),
  operation text not null check (length(operation) > 0),
  model text,
  latency_ms integer not null default 0 check (latency_ms >= 0),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  audio_ms bigint not null default 0 check (audio_ms >= 0),
  error_category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_user_id_idx on public.profiles (user_id);
create index documents_user_id_created_at_idx on public.documents (user_id, created_at desc);
create index interview_profiles_user_id_updated_at_idx on public.interview_profiles (user_id, updated_at desc);
create index sessions_user_id_created_at_idx on public.sessions (user_id, created_at desc);
create index sessions_interview_profile_id_idx on public.sessions (interview_profile_id);
create index recordings_user_id_created_at_idx on public.recordings (user_id, created_at desc);
create index recordings_session_id_created_at_idx on public.recordings (session_id, created_at desc);
create index utterances_user_id_created_at_idx on public.utterances (user_id, created_at desc);
create index utterances_session_id_sequence_idx on public.utterances (session_id, sequence);
create index questions_user_id_created_at_idx on public.questions (user_id, created_at desc);
create index questions_session_id_detected_ms_idx on public.questions (session_id, detected_ms);
create index guidance_events_user_id_created_at_idx on public.guidance_events (user_id, created_at desc);
create index guidance_events_session_id_created_at_idx on public.guidance_events (session_id, created_at desc);
create index reports_user_id_created_at_idx on public.reports (user_id, created_at desc);
create index reports_session_id_created_at_idx on public.reports (session_id, created_at desc);
create index usage_events_user_id_created_at_idx on public.usage_events (user_id, created_at desc);
create index usage_events_session_id_created_at_idx on public.usage_events (session_id, created_at desc);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger documents_set_updated_at before update on public.documents for each row execute function private.set_updated_at();
create trigger interview_profiles_set_updated_at before update on public.interview_profiles for each row execute function private.set_updated_at();
create trigger sessions_set_updated_at before update on public.sessions for each row execute function private.set_updated_at();
create trigger recordings_set_updated_at before update on public.recordings for each row execute function private.set_updated_at();
create trigger utterances_set_updated_at before update on public.utterances for each row execute function private.set_updated_at();
create trigger questions_set_updated_at before update on public.questions for each row execute function private.set_updated_at();
create trigger guidance_events_set_updated_at before update on public.guidance_events for each row execute function private.set_updated_at();
create trigger reports_set_updated_at before update on public.reports for each row execute function private.set_updated_at();
create trigger usage_events_set_updated_at before update on public.usage_events for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.interview_profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.recordings enable row level security;
alter table public.utterances enable row level security;
alter table public.questions enable row level security;
alter table public.guidance_events enable row level security;
alter table public.reports enable row level security;
alter table public.usage_events enable row level security;

grant select, insert, update, delete on public.profiles, public.documents, public.interview_profiles, public.sessions, public.recordings, public.utterances, public.questions, public.guidance_events, public.reports, public.usage_events to authenticated;
revoke all on public.profiles, public.documents, public.interview_profiles, public.sessions, public.recordings, public.utterances, public.questions, public.guidance_events, public.reports, public.usage_events from anon;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy profiles_delete_own on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy documents_select_own on public.documents for select to authenticated using ((select auth.uid()) = user_id);
create policy documents_insert_own on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy documents_update_own on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy documents_delete_own on public.documents for delete to authenticated using ((select auth.uid()) = user_id);

create policy interview_profiles_select_own on public.interview_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy interview_profiles_insert_own on public.interview_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy interview_profiles_update_own on public.interview_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy interview_profiles_delete_own on public.interview_profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy sessions_select_own on public.sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy sessions_insert_own on public.sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sessions_update_own on public.sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sessions_delete_own on public.sessions for delete to authenticated using ((select auth.uid()) = user_id);

create policy recordings_select_session_owner on public.recordings for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = recordings.session_id and sessions.user_id = (select auth.uid())));
create policy recordings_insert_session_owner on public.recordings for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = recordings.session_id and sessions.user_id = (select auth.uid())));
create policy recordings_update_session_owner on public.recordings for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = recordings.session_id and sessions.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = recordings.session_id and sessions.user_id = (select auth.uid())));
create policy recordings_delete_session_owner on public.recordings for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = recordings.session_id and sessions.user_id = (select auth.uid())));

create policy utterances_select_session_owner on public.utterances for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = utterances.session_id and sessions.user_id = (select auth.uid())));
create policy utterances_insert_session_owner on public.utterances for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = utterances.session_id and sessions.user_id = (select auth.uid())));
create policy utterances_update_session_owner on public.utterances for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = utterances.session_id and sessions.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = utterances.session_id and sessions.user_id = (select auth.uid())));
create policy utterances_delete_session_owner on public.utterances for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = utterances.session_id and sessions.user_id = (select auth.uid())));

create policy questions_select_session_owner on public.questions for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = questions.session_id and sessions.user_id = (select auth.uid())));
create policy questions_insert_session_owner on public.questions for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = questions.session_id and sessions.user_id = (select auth.uid())));
create policy questions_update_session_owner on public.questions for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = questions.session_id and sessions.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = questions.session_id and sessions.user_id = (select auth.uid())));
create policy questions_delete_session_owner on public.questions for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = questions.session_id and sessions.user_id = (select auth.uid())));

create policy guidance_events_select_session_owner on public.guidance_events for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = guidance_events.session_id and sessions.user_id = (select auth.uid())));
create policy guidance_events_insert_session_owner on public.guidance_events for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = guidance_events.session_id and sessions.user_id = (select auth.uid())));
create policy guidance_events_update_session_owner on public.guidance_events for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = guidance_events.session_id and sessions.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = guidance_events.session_id and sessions.user_id = (select auth.uid())));
create policy guidance_events_delete_session_owner on public.guidance_events for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = guidance_events.session_id and sessions.user_id = (select auth.uid())));

create policy reports_select_session_owner on public.reports for select to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = reports.session_id and sessions.user_id = (select auth.uid())));
create policy reports_insert_session_owner on public.reports for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = reports.session_id and sessions.user_id = (select auth.uid())));
create policy reports_update_session_owner on public.reports for update to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = reports.session_id and sessions.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = reports.session_id and sessions.user_id = (select auth.uid())));
create policy reports_delete_session_owner on public.reports for delete to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.sessions where sessions.id = reports.session_id and sessions.user_id = (select auth.uid())));

create policy usage_events_select_session_owner on public.usage_events for select to authenticated using ((select auth.uid()) = user_id and (session_id is null or exists (select 1 from public.sessions where sessions.id = usage_events.session_id and sessions.user_id = (select auth.uid()))));
create policy usage_events_insert_session_owner on public.usage_events for insert to authenticated with check ((select auth.uid()) = user_id and (session_id is null or exists (select 1 from public.sessions where sessions.id = usage_events.session_id and sessions.user_id = (select auth.uid()))));
create policy usage_events_update_session_owner on public.usage_events for update to authenticated using ((select auth.uid()) = user_id and (session_id is null or exists (select 1 from public.sessions where sessions.id = usage_events.session_id and sessions.user_id = (select auth.uid())))) with check ((select auth.uid()) = user_id and (session_id is null or exists (select 1 from public.sessions where sessions.id = usage_events.session_id and sessions.user_id = (select auth.uid()))));
create policy usage_events_delete_session_owner on public.usage_events for delete to authenticated using ((select auth.uid()) = user_id and (session_id is null or exists (select 1 from public.sessions where sessions.id = usage_events.session_id and sessions.user_id = (select auth.uid()))));

create policy private_objects_select_own on storage.objects for select to authenticated using (bucket_id in ('documents', 'recordings', 'exports') and name like (select auth.uid()::text) || '/%');
create policy private_objects_insert_own on storage.objects for insert to authenticated with check (bucket_id in ('documents', 'recordings', 'exports') and name like (select auth.uid()::text) || '/%');
create policy private_objects_update_own on storage.objects for update to authenticated using (bucket_id in ('documents', 'recordings', 'exports') and name like (select auth.uid()::text) || '/%') with check (bucket_id in ('documents', 'recordings', 'exports') and name like (select auth.uid()::text) || '/%');
create policy private_objects_delete_own on storage.objects for delete to authenticated using (bucket_id in ('documents', 'recordings', 'exports') and name like (select auth.uid()::text) || '/%');
