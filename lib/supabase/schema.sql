-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Drop and recreate agents table (optional, only if needed)
drop table if exists public.agents cascade;
create table public.agents (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  webhook_url text not null,
  status text default 'active',
  response_format text default 'text',
  configuration jsonb,
  created_by uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Drop and recreate conversations table
drop table if exists public.conversations cascade;
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null, -- Accepts "guest" or any user ID as text
  agent_id uuid references public.agents(id),
  started_at timestamp with time zone default now(),
  last_message_at timestamp with time zone default now(),
  title text,
  is_archived boolean default false,
  metadata jsonb
);

-- Drop and recreate messages table
drop table if exists public.messages cascade;
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_type text not null,
  content text not null,
  content_type text default 'text',
  timestamp timestamp with time zone default now(),
  read_status text default 'unread',
  metadata jsonb
);

-- Indexes
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_conversations_agent_id on public.conversations(agent_id);
create index idx_conversations_last_message_at on public.conversations(last_message_at);

-- Enable Row Level Security (RLS)
alter table public.agents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Policies
create policy "Allow anonymous access to agents" on public.agents
  for all using (true);

create policy "Allow anonymous access to conversations" on public.conversations
  for all using (true);

create policy "Allow anonymous access to messages" on public.messages
  for all using (true);

-- Triggers
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_agents_updated_at
before update on public.agents
for each row execute function update_updated_at();

create or replace function update_conversation_last_message_at()
returns trigger as $$
begin
  update public.conversations
  set last_message_at = new.timestamp
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

create trigger update_conversation_last_message_at
after insert on public.messages
for each row execute function update_conversation_last_message_at();
