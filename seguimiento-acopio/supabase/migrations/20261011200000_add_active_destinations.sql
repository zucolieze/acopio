create type public.destination_status as enum ('activo', 'cerrado');

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  destination_type public.destination_type not null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  status public.destination_status not null default 'activo',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  check (
    (status = 'activo' and closed_at is null)
    or (status = 'cerrado' and closed_at is not null)
  )
);

create index destinations_group_status_created_idx
  on public.destinations (group_id, status, created_at desc);

drop policy "Members can view loads in their groups" on public.loads;
drop policy "Providers can create loads in their groups" on public.loads;
drop policy "Providers can update their own loads" on public.loads;
drop policy "Providers can delete their own loads" on public.loads;
drop index public.loads_lot_id_date_idx;

alter table public.loads
  drop column lot_id,
  drop column cereal_type,
  drop column variety,
  drop column humidity,
  drop column destination_type,
  drop column destination_name,
  add column destination_id uuid not null
    references public.destinations (id) on delete restrict;

create index loads_destination_date_idx
  on public.loads (destination_id, date desc);

create function public.has_role_for_destination(
  p_destination_id uuid,
  p_role public.member_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.destinations as d
    join public.members as m on m.group_id = d.group_id
    where d.id = p_destination_id
      and m.user_id = (select auth.uid())
      and m.role = p_role
  );
$$;

create function public.can_add_load(p_destination_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.destinations as d
    join public.members as m on m.group_id = d.group_id
    where d.id = p_destination_id
      and d.status = 'activo'
      and m.user_id = (select auth.uid())
      and m.role = 'proveedor'
  );
$$;

alter table public.destinations enable row level security;

create policy "Members can view destinations in their groups"
  on public.destinations for select to authenticated
  using (public.is_group_member(group_id));

create policy "Providers can create destinations"
  on public.destinations for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and status = 'activo'
    and closed_at is null
    and public.has_role_for_group(group_id, 'proveedor')
  );

create policy "Providers can close active destinations"
  on public.destinations for update to authenticated
  using (
    status = 'activo'
    and public.has_role_for_group(group_id, 'proveedor')
  )
  with check (
    status = 'cerrado'
    and closed_at is not null
    and public.has_role_for_group(group_id, 'proveedor')
  );

create policy "Members can view loads in their groups"
  on public.loads for select to authenticated
  using (
    public.has_role_for_destination(destination_id, 'proveedor')
    or public.has_role_for_destination(destination_id, 'cliente')
  );

create policy "Providers can add loads to active destinations"
  on public.loads for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.can_add_load(destination_id)
  );

revoke all on public.destinations, public.loads
  from public, anon, authenticated;

grant select, insert on public.destinations to authenticated;
grant update (status, closed_at) on public.destinations to authenticated;
grant select, insert on public.loads to authenticated;

revoke all on type public.destination_status from public, anon;
grant usage on type public.destination_status to authenticated;

revoke all on function public.has_role_for_destination(uuid, public.member_role)
  from public, anon;
revoke all on function public.can_add_load(uuid) from public, anon;

grant execute on function public.has_role_for_destination(uuid, public.member_role)
  to authenticated;
grant execute on function public.can_add_load(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'destinations'
  ) then
    alter publication supabase_realtime add table public.destinations;
  end if;
end;
$$;
