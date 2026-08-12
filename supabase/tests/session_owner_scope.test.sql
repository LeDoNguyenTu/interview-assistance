begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

insert into auth.users (id, email)
values
  ('33333333-3333-3333-3333-333333333333', 'session-owner@example.test'),
  ('44444444-4444-4444-4444-444444444444', 'session-other@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select lives_ok(
  $$insert into public.sessions (id, user_id, title, mode, status, provider, platform, capture_sources, recording_enabled)
    values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Owner draft', 'coach', 'draft', 'fixture', 'web', array[]::text[], false)$$,
  'the authenticated owner can create a draft session'
);

set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select is_empty(
  $$select id from public.sessions where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'$$,
  'a second authenticated user receives no row for the owner session'
);

select * from finish();

rollback;
