-- 1. Create custom types and profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('admin', 'member', 'guest')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  bio text,
  pace_category text default '펀런 (6:00~)',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- 2. Helper functions to check role & status
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_approved()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
end;
$$ language plpgsql security definer;

-- 3. Profiles RLS Policies
create policy "Allow everyone to read profiles"
  on public.profiles for select
  to authenticated, anon
  using (true);

create policy "Allow users to update own profile bio and pace"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Allow admins to update any profile role and status"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Allow admins to delete profile"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- 4. Auth User Created Trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_count int;
  initial_role text := 'member';
  initial_status text := 'pending';
begin
  select count(*) into user_count from public.profiles;
  -- If this is the very first user, automatically make them admin & approved
  if user_count = 0 then
    initial_role := 'admin';
    initial_status := 'approved';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    initial_role,
    initial_status
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Posts Table
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text not null check (category in ('NOTICE', 'REGULAR_RUN', 'FLASH_RUN', 'COURSE_RECOMMEND', 'FREE_TALK', 'GEAR_REVIEW')),
  run_date timestamptz,
  location text,
  distance_km numeric(4,1),
  pace text,
  max_participants int default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

-- Posts Policies
create policy "Anyone can read posts"
  on public.posts for select
  to authenticated, anon
  using (true);

create policy "Approved members can insert posts"
  on public.posts for insert
  to authenticated
  with check (public.is_approved() and auth.uid() = author_id);

create policy "Authors or admins can update posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

create policy "Authors or admins can delete posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id or public.is_admin());

-- 6. Run Participants Table
create table if not exists public.run_participants (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

alter table public.run_participants enable row level security;

-- Run Participants Policies
create policy "Anyone can read participants"
  on public.run_participants for select
  to authenticated, anon
  using (true);

create policy "Approved users can join runs"
  on public.run_participants for insert
  to authenticated
  with check (public.is_approved() and auth.uid() = user_id);

create policy "Users can cancel their own participation"
  on public.run_participants for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- 7. Comments Table
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- Comments Policies
create policy "Anyone can read comments"
  on public.comments for select
  to authenticated, anon
  using (true);

create policy "Approved members can insert comments"
  on public.comments for insert
  to authenticated
  with check (public.is_approved() and auth.uid() = author_id);

create policy "Authors or admins can delete comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id or public.is_admin());
