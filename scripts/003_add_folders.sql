-- Add folders support and optional file-to-folder relation.
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_public boolean default false,
  share_token text unique,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.folders enable row level security;

create policy "folders_select_own"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "folders_insert_own"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "folders_update_own"
  on public.folders for update
  using (auth.uid() = user_id);

create policy "folders_delete_own"
  on public.folders for delete
  using (auth.uid() = user_id);

create index if not exists folders_user_id_idx on public.folders(user_id);
create index if not exists folders_share_token_idx on public.folders(share_token) where share_token is not null;

alter table public.files
  add column if not exists folder_id uuid references public.folders(id) on delete set null;

create index if not exists files_folder_id_idx on public.files(folder_id);
