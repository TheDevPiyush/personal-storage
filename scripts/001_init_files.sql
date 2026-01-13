-- Create files table to track file metadata
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  file_type text not null,
  file_size bigint not null,
  storage_path text not null,
  uploaded_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.files enable row level security;

-- Create RLS policies - users can only see their own files
create policy "files_select_own"
  on public.files for select
  using (auth.uid() = user_id);

create policy "files_insert_own"
  on public.files for insert
  with check (auth.uid() = user_id);

create policy "files_update_own"
  on public.files for update
  using (auth.uid() = user_id);

create policy "files_delete_own"
  on public.files for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists files_user_id_idx on public.files(user_id);
create index if not exists files_uploaded_at_idx on public.files(uploaded_at);
