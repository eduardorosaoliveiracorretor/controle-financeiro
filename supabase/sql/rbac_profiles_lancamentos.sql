-- 1) Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('master', 'contador')) default 'contador',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profile bootstrap trigger
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'contador')
  )
  on conflict (id) do update
    set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

-- Backfill profiles for existing users
insert into public.profiles (id, full_name, role)
select u.id,
       coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
       coalesce(u.raw_user_meta_data->>'role', 'contador')
from auth.users u
on conflict (id) do nothing;

-- 2) Despesas adjustments (tabela equivalente a lançamentos)
alter table public.despesas
  add column if not exists responsavel_id uuid references auth.users(id),
  add column if not exists data_da_compra date;

update public.despesas
set responsavel_id = coalesce(responsavel_id, user_id)
where responsavel_id is null;

-- 3) Helper function for role
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 4) RLS policies
alter table public.despesas enable row level security;

-- SELECT: master e contador veem tudo
create policy if not exists "despesas_select_all_roles"
on public.despesas
for select
using (public.get_my_role() in ('master', 'contador'));

-- INSERT: master/contador, com responsavel_id = auth.uid()
create policy if not exists "despesas_insert_master_contador"
on public.despesas
for insert
with check (
  public.get_my_role() in ('master', 'contador')
  and responsavel_id = auth.uid()
);

-- UPDATE: master tudo; contador somente próprios (regra padrão)
create policy if not exists "despesas_update_master_or_own"
on public.despesas
for update
using (
  public.get_my_role() = 'master'
  or (public.get_my_role() = 'contador' and responsavel_id = auth.uid())
)
with check (
  public.get_my_role() = 'master'
  or (public.get_my_role() = 'contador' and responsavel_id = auth.uid())
);

-- DELETE: master (opcional contador próprio -> ajuste abaixo se quiser)
create policy if not exists "despesas_delete_master_only"
on public.despesas
for delete
using (public.get_my_role() = 'master');

-- Profiles policies
create policy if not exists "profiles_select_authenticated"
on public.profiles
for select
using (auth.role() = 'authenticated');

create policy if not exists "profiles_insert_self_or_master"
on public.profiles
for insert
with check (id = auth.uid() or public.get_my_role() = 'master');

create policy if not exists "profiles_update_self_or_master"
on public.profiles
for update
using (id = auth.uid() or public.get_my_role() = 'master')
with check (id = auth.uid() or public.get_my_role() = 'master');
