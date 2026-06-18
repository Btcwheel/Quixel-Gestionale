-- Chat sessions: one per project (or multiple, one per conversation)
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat messages
create table if not exists chat_messages (
  id text primary key, -- AI SDK message id
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  parts jsonb not null default '[]',
  created_at timestamptz default now()
);

create index if not exists chat_messages_session_id_idx on chat_messages(session_id, created_at);
create index if not exists chat_sessions_project_id_idx on chat_sessions(project_id, user_id);

-- RLS
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

do $$ begin
  create policy "Users own their chat sessions"
    on chat_sessions for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users own their chat messages"
    on chat_messages for all
    using (
      session_id in (
        select id from chat_sessions where user_id = auth.uid()
      )
    )
    with check (
      session_id in (
        select id from chat_sessions where user_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

-- Auto-update updated_at on chat_sessions
create or replace function update_chat_session_timestamp()
returns trigger language plpgsql as $$
begin
  update chat_sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$;

drop trigger if exists chat_message_inserted on chat_messages;
create trigger chat_message_inserted
  after insert on chat_messages
  for each row execute function update_chat_session_timestamp();
