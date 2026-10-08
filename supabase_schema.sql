-- Supabase SQL Database Schema and Storage Setup for Posean (Professional Edition)

-- 1. Create profiles table with role and tier support
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  role text default 'user' not null check (role in ('user', 'admin')),
  is_pro boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely add columns if profiles table already exists
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'role') then
    alter table public.profiles add column role text default 'user' not null check (role in ('user', 'admin'));
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_pro') then
    alter table public.profiles add column is_pro boolean default false not null;
  end if;
end $$;

-- 2. Create photobooths table
create table if not exists public.photobooths (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  theme text not null,
  caption text,
  frame_count integer not null,
  jpg_url text,
  gif_url text,
  is_favorite boolean default false not null,
  is_public boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create CMS tables for dynamic Frames & Stickers
create table if not exists public.cms_frames (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text default 'strip' not null check (type in ('strip', 'grid')),
  frames integer default 4 not null,
  aspect_ratio text default '4/3' not null,
  bg_color text default '#FFFFFF' not null,
  text_color text default '#1E293B' not null,
  is_pro boolean default false not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.cms_stickers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text default 'Doodles' not null,
  svg_content text,
  image_url text,
  is_pro boolean default false not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Helper function to check if the current user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 4. Enable RLS
alter table public.profiles enable row level security;
alter table public.photobooths enable row level security;
alter table public.cms_frames enable row level security;
alter table public.cms_stickers enable row level security;

-- Profiles Policies
drop policy if exists "Users can view all profiles" on public.profiles;
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- Photobooths Policies (Admins can view and delete any photobooths for moderation)
drop policy if exists "Users can view their own photobooths" on public.photobooths;
create policy "Users can view photobooths"
  on public.photobooths for select
  using (auth.uid() = user_id or is_public = true or public.is_admin());

drop policy if exists "Users can insert their own photobooths" on public.photobooths;
create policy "Users can insert their own photobooths"
  on public.photobooths for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own photobooths" on public.photobooths;
create policy "Users can update their own photobooths"
  on public.photobooths for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can delete their own photobooths" on public.photobooths;
create policy "Users and Admins can delete photobooths"
  on public.photobooths for delete
  using (auth.uid() = user_id or public.is_admin());

-- CMS Frames Policies
drop policy if exists "Public read active frames" on public.cms_frames;
create policy "Public read active frames"
  on public.cms_frames for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage frames" on public.cms_frames;
create policy "Admins manage frames"
  on public.cms_frames for all
  using (public.is_admin())
  with check (public.is_admin());

-- CMS Stickers Policies
drop policy if exists "Public read active stickers" on public.cms_stickers;
create policy "Public read active stickers"
  on public.cms_stickers for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage stickers" on public.cms_stickers;
create policy "Admins manage stickers"
  on public.cms_stickers for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Trigger for auto-creating profile on user sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, role, is_pro)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    'user',
    false
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Setup Storage Bucket policies for 'photobooths'
insert into storage.buckets (id, name, public)
values ('photobooths', 'photobooths', true)
on conflict (id) do nothing;

drop policy if exists "Public access to photobooths storage" on storage.objects;
create policy "Public access to photobooths storage"
  on storage.objects for select
  using (bucket_id = 'photobooths');

drop policy if exists "Authenticated users can upload photobooths objects" on storage.objects;
create policy "Authenticated users can upload photobooths objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photobooths' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users and Admins can delete storage objects" on storage.objects;
create policy "Users and Admins can delete storage objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photobooths' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Optional: Aktifkan baris di bawah jika ingin mengizinkan pengguna tamu (tanpa login) mengunggah foto ke storage untuk QR code instan:
-- drop policy if exists "Allow guest uploads to photobooths" on storage.objects;
-- create policy "Allow guest uploads to photobooths"
--   on storage.objects for insert
--   to anon
--   with check (bucket_id = 'photobooths');

-- 7. Create Community Frame Templates Table
create table if not exists public.frame_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  creator_name text not null default 'Anonymous',
  creator_avatar text,
  name text not null,
  description text,
  type text default 'strip' not null check (type in ('strip', 'grid')),
  frames integer default 4 not null,
  aspect_ratio text default '4/3' not null,
  bg_color text default '#FFFFFF' not null,
  text_color text default '#1E293B' not null,
  caption text,
  default_filter text default 'none',
  stickers jsonb default '[]'::jsonb,
  image_url text,
  frame_mode text default 'overlay',
  is_public boolean default true not null,
  uses_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migration columns if table already existed
alter table public.frame_templates add column if not exists image_url text;
alter table public.frame_templates add column if not exists frame_mode text default 'overlay';

alter table public.frame_templates enable row level security;

-- Public can view all public templates
drop policy if exists "Public read frame templates" on public.frame_templates;
create policy "Public read frame templates"
  on public.frame_templates for select
  using (is_public = true or auth.uid() = user_id or public.is_admin());

-- Authenticated users can create templates
drop policy if exists "Authenticated insert frame templates" on public.frame_templates;
create policy "Authenticated insert frame templates"
  on public.frame_templates for insert
  with check (auth.uid() = user_id or user_id is null or public.is_admin());

-- Users can update their own templates or increment uses_count
drop policy if exists "Users update own frame templates" on public.frame_templates;
create policy "Users update own frame templates"
  on public.frame_templates for update
  using (auth.uid() = user_id or public.is_admin() or true);

-- Users can delete their own templates, and admins can delete any
drop policy if exists "Users delete own frame templates" on public.frame_templates;
create policy "Users delete own frame templates"
  on public.frame_templates for delete
  using (auth.uid() = user_id or public.is_admin());

