begin;

create extension if not exists pgtap with schema extensions;

select plan(87);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'documents', 'documents table exists');
select has_table('public', 'interview_profiles', 'interview_profiles table exists');
select has_table('public', 'sessions', 'sessions table exists');
select has_table('public', 'recordings', 'recordings table exists');
select has_table('public', 'utterances', 'utterances table exists');
select has_table('public', 'questions', 'questions table exists');
select has_table('public', 'guidance_events', 'guidance_events table exists');
select has_table('public', 'reports', 'reports table exists');
select has_table('public', 'usage_events', 'usage_events table exists');

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.documents'::regclass), 'documents has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.interview_profiles'::regclass), 'interview_profiles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.sessions'::regclass), 'sessions has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.recordings'::regclass), 'recordings has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.utterances'::regclass), 'utterances has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.questions'::regclass), 'questions has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.guidance_events'::regclass), 'guidance_events has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.reports'::regclass), 'reports has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.usage_events'::regclass), 'usage_events has RLS enabled');

select has_check('public', 'profiles', 'profiles has required checks');
select has_check('public', 'documents', 'documents has required checks');
select has_check('public', 'interview_profiles', 'interview_profiles has required checks');
select has_check('public', 'sessions', 'sessions has required checks');
select has_check('public', 'recordings', 'recordings has required checks');
select has_check('public', 'utterances', 'utterances has required checks');
select has_check('public', 'questions', 'questions has required checks');
select has_check('public', 'guidance_events', 'guidance_events has required checks');
select has_check('public', 'reports', 'reports has required checks');
select has_check('public', 'usage_events', 'usage_events has required checks');

select col_has_check('public', 'profiles', 'default_provider', 'profiles constrain default provider');
select col_has_check('public', 'documents', 'storage_path', 'documents constrain owner-prefixed storage paths');
select col_has_check('public', 'documents', 'byte_size', 'documents constrain storage size');
select col_has_check('public', 'interview_profiles', 'title', 'interview profiles require titles');
select col_has_check('public', 'sessions', 'mode', 'sessions constrain mode');
select col_has_check('public', 'recordings', 'storage_path', 'recordings constrain owner-prefixed storage paths');
select col_has_check('public', 'recordings', 'byte_size', 'recordings constrain storage size');
select col_has_check('public', 'recordings', 'duration_ms', 'recordings reject negative duration');
select col_has_check('public', 'utterances', 'sequence', 'utterances reject negative sequence');
select col_has_check('public', 'utterances', 'start_ms', 'utterances reject negative start time');
select col_has_check('public', 'utterances', 'end_ms', 'utterances require ordered timestamps');
select col_has_check('public', 'utterances', 'confidence', 'utterances constrain confidence');
select col_has_check('public', 'questions', 'detected_ms', 'questions reject negative detected time');
select col_has_check('public', 'questions', 'confidence', 'questions constrain confidence');
select col_has_check('public', 'guidance_events', 'latency_ms', 'guidance events reject negative latency');
select col_has_check('public', 'guidance_events', 'input_tokens', 'guidance events reject negative input tokens');
select col_has_check('public', 'guidance_events', 'output_tokens', 'guidance events reject negative output tokens');
select col_has_check('public', 'usage_events', 'latency_ms', 'usage events reject negative latency');
select col_has_check('public', 'usage_events', 'input_tokens', 'usage events reject negative input tokens');
select col_has_check('public', 'usage_events', 'output_tokens', 'usage events reject negative output tokens');
select col_has_check('public', 'usage_events', 'audio_ms', 'usage events reject negative audio duration');

select has_index('public', 'documents', 'documents_user_id_created_at_idx', 'documents owner access index exists');
select has_index('public', 'interview_profiles', 'interview_profiles_user_id_updated_at_idx', 'interview profiles owner access index exists');
select has_index('public', 'sessions', 'sessions_user_id_created_at_idx', 'sessions owner access index exists');
select has_index('public', 'sessions', 'sessions_interview_profile_id_idx', 'sessions profile access index exists');
select has_index('public', 'recordings', 'recordings_user_id_created_at_idx', 'recordings owner access index exists');
select has_index('public', 'recordings', 'recordings_session_id_created_at_idx', 'recordings session access index exists');
select has_index('public', 'utterances', 'utterances_user_id_created_at_idx', 'utterances owner access index exists');
select has_index('public', 'questions', 'questions_user_id_created_at_idx', 'questions owner access index exists');
select has_index('public', 'questions', 'questions_session_id_detected_ms_idx', 'questions session access index exists');
select has_index('public', 'guidance_events', 'guidance_events_user_id_created_at_idx', 'guidance owner access index exists');
select has_index('public', 'guidance_events', 'guidance_events_session_id_created_at_idx', 'guidance session access index exists');
select has_index('public', 'reports', 'reports_user_id_created_at_idx', 'reports owner access index exists');
select has_index('public', 'reports', 'reports_session_id_created_at_idx', 'reports session access index exists');
select has_index('public', 'usage_events', 'usage_events_user_id_created_at_idx', 'usage owner access index exists');
select has_index('public', 'usage_events', 'usage_events_session_id_created_at_idx', 'usage session access index exists');

select col_is_unique('public', 'profiles', 'user_id', 'profiles has one row per owner');
select col_is_unique('public', 'utterances', array['session_id', 'sequence'], 'utterances have unique session sequences');
select col_is_unique('public', 'guidance_events', array['session_id', 'idempotency_key'], 'guidance operations are idempotent per session');
select col_is_unique('public', 'reports', array['session_id', 'idempotency_key'], 'report operations are idempotent per session');

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.test');

set local role anon;
select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  'permission denied for table profiles',
  'anonymous users cannot read application rows'
);
select throws_ok(
  $$insert into public.profiles (user_id, display_name) values ('11111111-1111-1111-1111-111111111111', 'Owner')$$,
  '42501',
  'permission denied for table profiles',
  'anonymous users cannot write application rows'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select lives_ok(
  $$insert into public.profiles (user_id, display_name) values ('11111111-1111-1111-1111-111111111111', 'Owner')$$,
  'an authenticated owner can create a profile'
);
select results_eq(
  $$select display_name from public.profiles$$,
  $$values ('Owner'::text)$$,
  'an authenticated owner can read their profile'
);
select throws_ok(
  $$insert into public.documents (user_id, storage_path, original_filename, media_type, byte_size) values ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111/too-large.pdf', 'too-large.pdf', 'application/pdf', 52428801)$$,
  '23514',
  null,
  'document storage sizes have a database constraint'
);
select throws_ok(
  $$insert into public.sessions (user_id, title, mode, status, provider, platform, capture_sources, recording_enabled, consented_at) values ('11111111-1111-1111-1111-111111111111', 'Invalid consent', 'coach', 'draft', 'fixture', 'web', array['microphone']::text[], false, now())$$,
  '23514',
  null,
  'sessions reject an incomplete consent state'
);

insert into public.sessions (id, user_id, title, mode, status, provider, platform, capture_sources, recording_enabled)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Owner session',
  'coach',
  'draft',
  'fixture',
  'web',
  array['microphone']::text[],
  false
);
select throws_ok(
  $$insert into public.utterances (user_id, session_id, sequence, speaker, text, start_ms, end_ms, is_final, confidence) values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 'candidate', 'invalid confidence', 0, 1, true, 1.1)$$,
  '23514',
  null,
  'utterance confidence is constrained to the valid range'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'a second user cannot read the owner session'
);
select is_empty(
  $$update public.sessions set title = 'Changed' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning id$$,
  'a second user cannot update the owner session'
);
select is_empty(
  $$delete from public.sessions where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning id$$,
  'a second user cannot delete the owner session'
);
select throws_ok(
  $$insert into public.utterances (user_id, session_id, sequence, speaker, text, start_ms, end_ms, is_final, confidence) values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 'candidate', 'attempt', 0, 1, true, 0.9)$$,
  '42501',
  'new row violates row-level security policy for table "utterances"',
  'a second user cannot insert a child row into the owner session'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select throws_ok(
  $$update public.sessions set user_id = '22222222-2222-2222-2222-222222222222' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  '42501',
  'new row violates row-level security policy for table "sessions"',
  'update checks prevent changing ownership'
);

select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('documents', '11111111-1111-1111-1111-111111111111/resume.pdf', '11111111-1111-1111-1111-111111111111')$$,
  'an owner can create a private document object under their prefix'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('recordings', '11111111-1111-1111-1111-111111111111/interview.webm', '11111111-1111-1111-1111-111111111111')$$,
  'an owner can create a private recording object under their prefix'
);
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from storage.objects where bucket_id = 'documents' and name = '11111111-1111-1111-1111-111111111111/resume.pdf'$$,
  'private document paths reject cross-user access'
);
select is_empty(
  $$select * from storage.objects where bucket_id = 'recordings' and name = '11111111-1111-1111-1111-111111111111/interview.webm'$$,
  'private recording paths reject cross-user access'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('exports', '11111111-1111-1111-1111-111111111111/report.pdf', '22222222-2222-2222-2222-222222222222')$$,
  '42501',
  'new row violates row-level security policy for table "objects"',
  'private export paths reject a cross-user prefix'
);

select * from finish();

rollback;
