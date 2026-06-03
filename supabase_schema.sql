-- Supabase SQL Database Schema and Storage Setup for Posean

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 4. Enable RLS for photobooths
alter table public.photobooths enable row level security;

create policy "Users can view their own photobooths"
  on public.photobooths for select
  using (auth.uid() = user_id);

create policy "Users can insert their own photobooths"
  on public.photobooths for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own photobooths"
  on public.photobooths for update
  using (auth.uid() = user_id);

create policy "Users can delete their own photobooths"
  on public.photobooths for delete
  using (auth.uid() = user_id);

-- 5. Trigger for auto-creating profile on user sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Setup Storage Bucket policies for 'photobooths'
-- Run this block after creating the 'photobooths' bucket in your Supabase dashboard or via API
-- Ensure the bucket exists:
insert into storage.buckets (id, name, public)
values ('photobooths', 'photobooths', true)
on conflict (id) do nothing;

create policy "Public access to photobooths storage"
  on storage.objects for select
  using (bucket_id = 'photobooths');

create policy "Authenticated users can upload photobooths objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photobooths' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Authenticated users can delete their own photobooths objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photobooths' and (storage.foldername(name))[1] = auth.uid()::text);
