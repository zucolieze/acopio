alter table public.groups
  add column deleted_at timestamptz;

alter table public.lots
  add column deleted_at timestamptz;

alter table public.destinations
  add column lot_id uuid,
  add column capacity_kg numeric(12, 2),
  add column opening_humidity numeric(5, 2),
  add column opening_humidity_at timestamptz,
  add column closing_humidity numeric(5, 2),
  add column closing_humidity_at timestamptz,
  add column deleted_at timestamptz;

alter table public.loads
  add column deleted_at timestamptz;

create function public.ensure_default_work_structure(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season_id uuid;
  v_field_id uuid;
begin
  insert into public.seasons (group_id, name, year)
  values (p_group_id, 'Campaña inicial', extract(year from now())::integer)
  on conflict (group_id, name) do update set name = excluded.name
  returning id into v_season_id;

  insert into public.fields (group_id, season_id, name)
  values (p_group_id, v_season_id, 'Campo principal')
  on conflict (season_id, name) do update set name = excluded.name
  returning id into v_field_id;

  insert into public.lots (field_id, name)
  values (v_field_id, 'Lote 1')
  on conflict (field_id, name) do update set name = excluded.name;
end;
$$;

create function public.create_default_work_structure()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ensure_default_work_structure(new.id);
  return new;
end;
$$;

create trigger create_default_work_structure_after_group_insert
  after insert on public.groups
  for each row execute function public.create_default_work_structure();

do $$
declare
  v_group_id uuid;
begin
  for v_group_id in select id from public.groups
  loop
    perform public.ensure_default_work_structure(v_group_id);
  end loop;
end;
$$;

update public.destinations as d
set lot_id = (
  select l.id
  from public.lots as l
  join public.fields as f on f.id = l.field_id
  where f.group_id = d.group_id
    and l.name = 'Lote 1'
  order by l.created_at
  limit 1
)
where d.lot_id is null;

alter table public.destinations
  alter column lot_id set not null,
  add constraint destinations_lot_id_fkey
    foreign key (lot_id) references public.lots (id) on delete restrict,
  add constraint destinations_capacity_positive
    check (capacity_kg is null or capacity_kg > 0),
  add constraint destinations_humidity_range
    check (
      (opening_humidity is null or opening_humidity between 0 and 100)
      and (closing_humidity is null or closing_humidity between 0 and 100)
    ),
  add constraint destinations_humidity_timestamps
    check (
      (opening_humidity is null) = (opening_humidity_at is null)
      and (closing_humidity is null) = (closing_humidity_at is null)
    ),
  add constraint destinations_storage_humidity
    check (
      (destination_type = 'camion'
        and opening_humidity is null
        and closing_humidity is null)
      or destination_type in ('silo', 'silobolsa')
    );

create index destinations_lot_id_idx on public.destinations (lot_id);
create index destinations_group_deleted_idx on public.destinations (group_id, deleted_at);
create index loads_destination_deleted_date_idx
  on public.loads (destination_id, deleted_at, date desc);

create table public.change_audit (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  destination_id uuid,
  entity_type text not null check (entity_type in ('trabajo', 'lote', 'destino', 'carga')),
  entity_id uuid not null,
  action text not null check (action in ('editar', 'eliminar')),
  actor_id uuid references auth.users (id) on delete set null,
  occurred_at timestamptz not null default now(),
  changes jsonb not null,
  kg_delta numeric(12, 2)
);

create index change_audit_group_occurred_idx
  on public.change_audit (group_id, occurred_at desc);
create index change_audit_destination_occurred_idx
  on public.change_audit (destination_id, occurred_at desc);

create function public.is_group_active(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.groups as g
    where g.id = p_group_id
      and g.deleted_at is null
  );
$$;

create function public.validate_destination_details()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lot_group_id uuid;
  v_lot_deleted_at timestamptz;
begin
  select f.group_id into v_lot_group_id
  from public.lots as l
  join public.fields as f on f.id = l.field_id
  where l.id = new.lot_id;

  select l.deleted_at into v_lot_deleted_at
  from public.lots as l
  where l.id = new.lot_id;

  if v_lot_group_id is distinct from new.group_id then
    raise exception 'El lote elegido no pertenece a este trabajo o ya no está disponible.';
  end if;
  if v_lot_deleted_at is not null then
    if tg_op = 'INSERT' then
      raise exception 'No se pueden asignar destinos nuevos a un lote eliminado.';
    elsif old.lot_id is distinct from new.lot_id then
      raise exception 'No se pueden asignar destinos nuevos a un lote eliminado.';
    end if;
  end if;

  if new.destination_type = 'camion' then
    if tg_op = 'INSERT' and new.capacity_kg is null then
      raise exception 'Ingresá el límite de carga para el camión.';
    end if;
    if tg_op = 'UPDATE'
      and old.destination_type is distinct from new.destination_type
      and new.capacity_kg is null
    then
      raise exception 'Ingresá el límite de carga para el camión.';
    end if;
    new.opening_humidity := null;
    new.opening_humidity_at := null;
    new.closing_humidity := null;
    new.closing_humidity_at := null;
  else
    if tg_op = 'INSERT' then
      if new.opening_humidity is null then
        raise exception 'Ingresá la humedad inicial para abrir un silo o silobolsa.';
      end if;
      if new.opening_humidity_at is null then
        new.opening_humidity_at := now();
      end if;
    else
      if (new.status = 'cerrado' or old.destination_type = 'camion')
        and new.opening_humidity is null
      then
        raise exception 'Completá la humedad inicial antes de cerrar el silo o silobolsa.';
      end if;
      if new.status = 'cerrado' and new.closing_humidity is null then
        raise exception 'Ingresá la humedad de cierre para cerrar un silo o silobolsa.';
      end if;
      if new.opening_humidity is distinct from old.opening_humidity
        and new.opening_humidity_at is not distinct from old.opening_humidity_at
      then
        new.opening_humidity_at := now();
      end if;
      if new.closing_humidity is distinct from old.closing_humidity
        and new.closing_humidity_at is not distinct from old.closing_humidity_at
      then
        new.closing_humidity_at := now();
      end if;
    end if;
    if new.closing_humidity is not null and new.closing_humidity_at is null then
      new.closing_humidity_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger validate_destination_details_before_write
  before insert or update on public.destinations
  for each row execute function public.validate_destination_details();

create function public.prevent_deleting_lot_with_active_destinations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active_lot_count integer;
begin
  perform f.id
  from public.fields as f
  where f.id = old.field_id
  for update;

  select count(*) into v_active_lot_count
  from public.lots as l
  where l.field_id = old.field_id
    and l.deleted_at is null;

  if old.deleted_at is null
    and new.deleted_at is not null
    and v_active_lot_count <= 1
  then
    raise exception 'El trabajo debe conservar al menos un lote activo.';
  end if;

  if old.deleted_at is null
    and new.deleted_at is not null
    and exists (
      select 1
      from public.destinations as d
      where d.lot_id = old.id
        and d.status = 'activo'
        and d.deleted_at is null
    )
  then
    raise exception 'Cerrá o eliminá los destinos activos del lote antes de eliminarlo.';
  end if;
  return new;
end;
$$;

create trigger prevent_lot_deletion_with_active_destinations
  before update on public.lots
  for each row execute function public.prevent_deleting_lot_with_active_destinations();

create function public.record_entity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_group_id uuid;
  v_destination_id uuid;
  v_entity_type text;
  v_action text := 'editar';
  v_changes jsonb;
  v_kg_delta numeric(12, 2);
begin
  if v_old -> 'deleted_at' = 'null'::jsonb
    and v_new -> 'deleted_at' is not null
    and v_new -> 'deleted_at' <> 'null'::jsonb
  then
    v_action := 'eliminar';
  end if;

  select coalesce(
    jsonb_object_agg(
      old_values.key,
      jsonb_build_object(
        'antes', old_values.value,
        'despues', v_new -> old_values.key
      )
    ),
    '{}'::jsonb
  )
  into v_changes
  from jsonb_each(v_old) as old_values
  where old_values.value is distinct from v_new -> old_values.key;

  if v_changes = '{}'::jsonb then
    return new;
  end if;

  if tg_table_name = 'groups' then
    v_group_id := new.id;
    v_entity_type := 'trabajo';
  elsif tg_table_name = 'lots' then
    select f.group_id into v_group_id
    from public.fields as f
    where f.id = new.field_id;
    v_entity_type := 'lote';
  elsif tg_table_name = 'destinations' then
    v_group_id := new.group_id;
    v_destination_id := new.id;
    v_entity_type := 'destino';
  else
    select d.group_id into v_group_id
    from public.destinations as d
    where d.id = new.destination_id;
    v_entity_type := 'carga';
    v_destination_id := new.destination_id;
    if v_old -> 'kg' is distinct from v_new -> 'kg' then
      v_kg_delta := (new.kg - old.kg)::numeric(12, 2);
    end if;
  end if;

  insert into public.change_audit (
    group_id,
    destination_id,
    entity_type,
    entity_id,
    action,
    actor_id,
    changes,
    kg_delta
  )
  values (
    v_group_id,
    v_destination_id,
    v_entity_type,
    new.id,
    v_action,
    (select auth.uid()),
    v_changes,
    v_kg_delta
  );

  return new;
end;
$$;

create trigger audit_groups_update
  after update on public.groups
  for each row execute function public.record_entity_change();

create trigger audit_lots_update
  after update on public.lots
  for each row execute function public.record_entity_change();

create trigger audit_destinations_update
  after update on public.destinations
  for each row execute function public.record_entity_change();

create trigger audit_loads_update
  after update on public.loads
  for each row execute function public.record_entity_change();

create or replace function public.can_add_load(p_destination_id uuid)
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
    join public.lots as l on l.id = d.lot_id
    where d.id = p_destination_id
      and d.status = 'activo'
      and d.deleted_at is null
      and l.deleted_at is null
      and public.is_group_active(d.group_id)
      and m.user_id = (select auth.uid())
      and (
        m.role = 'proveedor'
        or (m.role = 'admin' and public.is_debug_admin())
      )
  );
$$;

create or replace function public.has_role_for_field(
  p_field_id uuid,
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
    from public.fields as f
    join public.members as m on m.group_id = f.group_id
    where f.id = p_field_id
      and public.is_group_active(f.group_id)
      and m.user_id = (select auth.uid())
      and (
        m.role = p_role
        or (m.role = 'admin' and public.is_debug_admin())
      )
  );
$$;

create or replace function public.has_role_for_destination(
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
      and public.is_group_active(d.group_id)
      and m.user_id = (select auth.uid())
      and (
        m.role = p_role
        or (m.role = 'admin' and public.is_debug_admin())
      )
  );
$$;

drop policy "Members can view their groups" on public.groups;
create policy "Members can view active groups"
  on public.groups for select to authenticated
  using (public.is_group_member(id) and deleted_at is null);

create policy "Providers can update group work"
  on public.groups for update to authenticated
  using (public.has_role_for_group(id, 'proveedor'))
  with check (public.has_role_for_group(id, 'proveedor'));

drop policy "Members can view lots in their groups" on public.lots;
create policy "Members can view lots in their groups"
  on public.lots for select to authenticated
  using (
    public.has_role_for_field(field_id, 'cliente')
    or public.has_role_for_field(field_id, 'proveedor')
  );

drop policy "Providers can delete lots in their groups" on public.lots;

drop policy "Members can view destinations in their groups" on public.destinations;
create policy "Members can view active destinations in their groups"
  on public.destinations for select to authenticated
  using (
    public.is_group_member(group_id)
    and public.is_group_active(group_id)
  );

drop policy "Providers can close active destinations" on public.destinations;
create policy "Providers can update destinations"
  on public.destinations for update to authenticated
  using (public.has_role_for_group(group_id, 'proveedor'))
  with check (public.has_role_for_group(group_id, 'proveedor'));

drop policy "Members can view loads in their groups" on public.loads;
create policy "Members can view active loads in their groups"
  on public.loads for select to authenticated
  using (
    deleted_at is null
    and (
      public.has_role_for_destination(destination_id, 'proveedor')
      or public.has_role_for_destination(destination_id, 'cliente')
    )
  );

create policy "Providers can update loads in their groups"
  on public.loads for update to authenticated
  using (public.has_role_for_destination(destination_id, 'proveedor'))
  with check (public.has_role_for_destination(destination_id, 'proveedor'));

alter table public.change_audit enable row level security;
create policy "Members can view work change history"
  on public.change_audit for select to authenticated
  using (public.is_group_member(group_id));

revoke all on public.change_audit from public, anon, authenticated;
grant select on public.change_audit to authenticated;

revoke all on public.groups from public, anon, authenticated;
grant select on public.groups to authenticated;
grant update (name, deleted_at) on public.groups to authenticated;

revoke all on public.lots from public, anon, authenticated;
grant select, insert on public.lots to authenticated;
grant update (name, deleted_at) on public.lots to authenticated;

revoke all on public.destinations from public, anon, authenticated;
grant select, insert on public.destinations to authenticated;
grant update (
  lot_id,
  destination_type,
  name,
  status,
  closed_at,
  capacity_kg,
  opening_humidity,
  opening_humidity_at,
  closing_humidity,
  closing_humidity_at,
  deleted_at
) on public.destinations to authenticated;

revoke all on public.loads from public, anon, authenticated;
grant select, insert on public.loads to authenticated;
grant update (date, kg, deleted_at) on public.loads to authenticated;

revoke all on function public.ensure_default_work_structure(uuid)
  from public, anon, authenticated;
revoke all on function public.create_default_work_structure()
  from public, anon, authenticated;
revoke all on function public.is_group_active(uuid)
  from public, anon;
revoke all on function public.record_entity_change()
  from public, anon, authenticated;
revoke all on function public.validate_destination_details()
  from public, anon, authenticated;
revoke all on function public.prevent_deleting_lot_with_active_destinations()
  from public, anon, authenticated;
revoke all on function public.can_add_load(uuid) from public, anon;

grant execute on function public.is_group_active(uuid) to authenticated;
grant execute on function public.can_add_load(uuid) to authenticated;
grant execute on function public.has_role_for_field(uuid, public.member_role)
  to authenticated;
grant execute on function public.has_role_for_destination(uuid, public.member_role)
  to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'change_audit'
  ) then
    alter publication supabase_realtime add table public.change_audit;
  end if;
end;
$$;
