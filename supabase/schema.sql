-- Samarkand Madina: menu admin schema for Supabase.
-- Run once in Supabase → SQL Editor → New query → Run. Safe to re-run.

create table if not exists public.categories (
  id        text primary key,
  name_ru   text not null,
  name_en   text not null,
  name_ar   text not null,
  sort      int  not null default 0,
  visible   boolean not null default true
);

create table if not exists public.dishes (
  id          text primary key,
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  price       numeric(8,2) not null check (price >= 0),
  image_url   text,
  name_ru     text not null,
  name_en     text not null,
  name_ar     text not null,
  comp_ru     text,
  comp_en     text,
  comp_ar     text,
  tags        text[] not null default '{}',
  available   boolean not null default true,   -- false = stop-list ("sold out today")
  visible     boolean not null default true,   -- false = hidden from the site
  sort        int not null default 0,
  updated_at  timestamptz not null default now()
);
create index if not exists dishes_category_sort on public.dishes (category_id, sort);

-- Who may use the admin. owner = everything, staff = stop-list only.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'staff' check (role in ('owner','staff')),
  created_at timestamptz not null default now()
);

create or replace function public.admin_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.admins where user_id = auth.uid()
$$;

-- updated_at + staff may change only "available"
create or replace function public.dishes_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.admin_role() = 'staff' and (
       new.category_id is distinct from old.category_id or new.price is distinct from old.price
    or new.image_url is distinct from old.image_url or new.name_ru is distinct from old.name_ru
    or new.name_en is distinct from old.name_en or new.name_ar is distinct from old.name_ar
    or new.comp_ru is distinct from old.comp_ru or new.comp_en is distinct from old.comp_en
    or new.comp_ar is distinct from old.comp_ar or new.tags is distinct from old.tags
    or new.visible is distinct from old.visible or new.sort is distinct from old.sort
    or new.id is distinct from old.id) then
    raise exception 'Staff can only change availability';
  end if;
  return new;
end $$;
drop trigger if exists dishes_guard on public.dishes;
create trigger dishes_guard before update on public.dishes for each row execute function public.dishes_guard();

alter table public.categories enable row level security;
alter table public.dishes     enable row level security;
alter table public.admins     enable row level security;

drop policy if exists "read visible categories" on public.categories;
create policy "read visible categories" on public.categories for select
  using (visible or public.admin_role() is not null);
drop policy if exists "owner writes categories" on public.categories;
create policy "owner writes categories" on public.categories for all to authenticated
  using (public.admin_role() = 'owner') with check (public.admin_role() = 'owner');

drop policy if exists "read visible dishes" on public.dishes;
create policy "read visible dishes" on public.dishes for select
  using (visible or public.admin_role() is not null);
drop policy if exists "admins update dishes" on public.dishes;
create policy "admins update dishes" on public.dishes for update to authenticated
  using (public.admin_role() is not null) with check (public.admin_role() is not null);
drop policy if exists "owner inserts dishes" on public.dishes;
create policy "owner inserts dishes" on public.dishes for insert to authenticated
  with check (public.admin_role() = 'owner');
drop policy if exists "owner deletes dishes" on public.dishes;
create policy "owner deletes dishes" on public.dishes for delete to authenticated
  using (public.admin_role() = 'owner');

drop policy if exists "see own admin row" on public.admins;
create policy "see own admin row" on public.admins for select to authenticated
  using (user_id = auth.uid() or public.admin_role() = 'owner');

-- API roles must be able to reach the tables (RLS above still decides which rows).
-- Explicit because newer Supabase projects may not auto-grant new tables to the API.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.dishes to anon, authenticated;
grant insert, update, delete on public.categories, public.dishes to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.admin_role() to anon, authenticated;

-- Photo storage: public read, owner upload
insert into storage.buckets (id, name, public) values ('dishes', 'dishes', true)
  on conflict (id) do update set public = true;
drop policy if exists "owner uploads dish photos" on storage.objects;
create policy "owner uploads dish photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'dishes' and public.admin_role() = 'owner');
drop policy if exists "owner updates dish photos" on storage.objects;
create policy "owner updates dish photos" on storage.objects for update to authenticated
  using (bucket_id = 'dishes' and public.admin_role() = 'owner');
drop policy if exists "owner deletes dish photos" on storage.objects;
create policy "owner deletes dish photos" on storage.objects for delete to authenticated
  using (bucket_id = 'dishes' and public.admin_role() = 'owner');
