begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

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

select ok(
  exists (
    select 1
    from pg_class
    where oid = 'public.sessions'::regclass
      and relrowsecurity
  ),
  'sessions has RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'utterances'
      and indexdef like '%UNIQUE%session_id, sequence%'
  ),
  'utterances has a unique session sequence index'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.sessions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%consent%'
  ),
  'sessions has a consent constraint'
);

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
  'new row for relation "documents" violates check constraint',
  'document storage sizes have a database constraint'
);
select throws_ok(
  $$insert into public.sessions (user_id, title, mode, status, provider, platform, capture_sources, recording_enabled, consented_at) values ('11111111-1111-1111-1111-111111111111', 'Invalid consent', 'coach', 'draft', 'fixture', 'web', array['microphone']::text[], false, now())$$,
  '23514',
  'new row for relation "sessions" violates check constraint',
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
  'new row for relation "utterances" violates check constraint',
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
