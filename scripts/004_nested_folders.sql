-- Nested folders: each folder can have a parent folder (same user).
alter table public.folders
  add column if not exists parent_id uuid references public.folders(id) on delete cascade;

create index if not exists folders_user_parent_idx on public.folders(user_id, parent_id);
