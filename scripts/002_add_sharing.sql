-- Add sharing fields to files table
alter table public.files
  add column if not exists is_public boolean default false,
  add column if not exists share_token text unique;

-- Create index for share_token for faster lookups
create index if not exists files_share_token_idx on public.files(share_token) where share_token is not null;

-- Create RLS policy to allow public access to shared files
-- This allows unauthenticated users to read files marked as public
create policy "files_select_public"
  on public.files for select
  using (is_public = true);

-- NOTE: You also need to configure your storage bucket for public access:
-- 1. Go to Supabase Dashboard > Storage > files bucket
-- 2. Click on "Policies" tab
-- 3. Create a new policy:
--    - Policy name: "Public file access"
--    - Allowed operation: SELECT
--    - Policy definition: true (or use: bucket_id = 'files')
--    - This allows anyone to read files from the bucket

