-- Enable UUID generation helper
create extension if not exists "pgcrypto";

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'New Chat',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  skills_used text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_message_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null,
  rating text not null check (rating in ('up', 'down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index if not exists chat_sessions_user_id_created_at_idx
  on public.chat_sessions (user_id, created_at desc);

create index if not exists chat_messages_user_id_created_at_idx
  on public.chat_messages (user_id, created_at asc);

create index if not exists chat_messages_session_id_created_at_idx
  on public.chat_messages (session_id, created_at asc);

create index if not exists chat_message_feedback_user_id_idx
  on public.chat_message_feedback (user_id);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_message_feedback enable row level security;

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own"
  on public.chat_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own"
  on public.chat_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own"
  on public.chat_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "chat_sessions_delete_own" on public.chat_sessions;
create policy "chat_sessions_delete_own"
  on public.chat_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
  on public.chat_messages
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
  on public.chat_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "chat_messages_update_own" on public.chat_messages;
create policy "chat_messages_update_own"
  on public.chat_messages
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
  on public.chat_messages
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "chat_message_feedback_select_own" on public.chat_message_feedback;
create policy "chat_message_feedback_select_own"
  on public.chat_message_feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "chat_message_feedback_insert_own" on public.chat_message_feedback;
create policy "chat_message_feedback_insert_own"
  on public.chat_message_feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "chat_message_feedback_update_own" on public.chat_message_feedback;
create policy "chat_message_feedback_update_own"
  on public.chat_message_feedback
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "chat_message_feedback_delete_own" on public.chat_message_feedback;
create policy "chat_message_feedback_delete_own"
  on public.chat_message_feedback
  for delete
  to authenticated
  using (auth.uid() = user_id);
