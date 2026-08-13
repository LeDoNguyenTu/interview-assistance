create table if not exists public.provider_credentials (
  user_id text not null,
  provider text not null check (provider in ('openai', 'gemini')),
  encrypted_api_key text not null check (length(encrypted_api_key) > 0),
  model text not null check (length(trim(model)) between 1 and 128),
  key_hint text not null check (length(key_hint) = 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);
