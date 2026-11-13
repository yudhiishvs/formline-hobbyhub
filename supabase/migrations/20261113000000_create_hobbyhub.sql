-- Formline: shared car design forum with anonymous browser identities.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null default '' check (char_length(body) <= 5000),
  image_url text check (
    image_url is null or
    (char_length(image_url) <= 2048 and image_url ~* '^https?://[^[:space:]]+$')
  ),
  upvotes integer not null default 0 check (upvotes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_created_idx on public.posts (created_at desc, id desc);
create index posts_upvotes_idx on public.posts (upvotes desc, created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index comments_post_created_idx on public.comments (post_id, created_at, id);

create function public.set_post_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
before update on public.posts
for each row execute function public.set_post_updated_at();

alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- Anonymous sign-ins use the authenticated role. Visitors share read access.
revoke all on table public.posts, public.comments from anon, authenticated;
grant select on table public.posts, public.comments to authenticated;
grant insert (user_id, title, body, image_url) on table public.posts to authenticated;
grant update (title, body, image_url) on table public.posts to authenticated;
grant delete on table public.posts to authenticated;
grant insert (post_id, user_id, body) on table public.comments to authenticated;

create policy "Signed-in visitors can read posts"
on public.posts for select to authenticated using (true);

create policy "Authors can create posts"
on public.posts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Authors can edit their posts"
on public.posts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Authors can delete their posts"
on public.posts for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Signed-in visitors can read comments"
on public.comments for select to authenticated using (true);

create policy "Signed-in visitors can comment"
on public.comments for insert to authenticated
with check ((select auth.uid()) = user_id);

-- Keep upvotes independent of author-only UPDATE grants and increment in one transaction.
create function public.upvote_post(post_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in required';
  end if;

  update public.posts
  set upvotes = upvotes + 1
  where id = post_id
  returning upvotes into next_count;

  if next_count is null then
    raise exception 'Post not found';
  end if;
  return next_count;
end;
$$;

revoke all on function public.upvote_post(uuid) from public, anon;
grant execute on function public.upvote_post(uuid) to authenticated;
