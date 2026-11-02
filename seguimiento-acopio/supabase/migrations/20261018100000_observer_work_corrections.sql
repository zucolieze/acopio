alter table public.change_audit
  drop constraint change_audit_entity_type_check,
  add constraint change_audit_entity_type_check
    check (entity_type in ('trabajo', 'campo', 'lote', 'destino', 'carga'));

create or replace function public.record_entity_change()
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
  elsif tg_table_name = 'fields' then
    v_group_id := new.group_id;
    v_entity_type := 'campo';
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

create trigger audit_fields_update
  after update on public.fields
  for each row execute function public.record_entity_change();

drop policy "Providers can update group fields" on public.fields;
create policy "Work members can update group fields"
  on public.fields for update to authenticated
  using (
    public.has_role_for_group(group_id, 'proveedor')
    or public.has_role_for_group(group_id, 'cliente')
  )
  with check (
    public.has_role_for_group(group_id, 'proveedor')
    or public.has_role_for_group(group_id, 'cliente')
  );

create policy "Observers can create group fields"
  on public.fields for insert to authenticated
  with check (public.has_role_for_group(group_id, 'cliente'));

drop policy "Providers can update lots in their groups" on public.lots;
create policy "Work members can update lots in their groups"
  on public.lots for update to authenticated
  using (
    public.has_role_for_field(field_id, 'proveedor')
    or public.has_role_for_field(field_id, 'cliente')
  )
  with check (
    public.has_role_for_field(field_id, 'proveedor')
    or public.has_role_for_field(field_id, 'cliente')
  );

create policy "Observers can create lots in their groups"
  on public.lots for insert to authenticated
  with check (public.has_role_for_field(field_id, 'cliente'));

create or replace function public.set_load_attribution(
  p_load_id uuid,
  p_created_by uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
begin
  select d.group_id
  into v_group_id
  from public.loads as l
  join public.destinations as d on d.id = l.destination_id
  where l.id = p_load_id
    and l.deleted_at is null
    and d.deleted_at is null
    and public.is_group_active(d.group_id);

  if v_group_id is null then
    raise exception 'No se encontró la pesada o el trabajo ya no está activo.';
  end if;

  if not public.has_role_for_group(v_group_id, 'cliente') then
    raise exception 'No tenés permiso para corregir esta pesada.';
  end if;

  if p_created_by is not null and not exists (
    select 1
    from public.members as m
    where m.group_id = v_group_id
      and m.user_id = p_created_by
  ) then
    raise exception 'La persona elegida no pertenece a este trabajo.';
  end if;

  update public.loads
  set created_by = p_created_by
  where id = p_load_id;

  if not found then
    raise exception 'No se pudo actualizar quién realizó la pesada.';
  end if;
end;
$$;

revoke all on function public.set_load_attribution(uuid, uuid)
  from public, anon;
grant execute on function public.set_load_attribution(uuid, uuid)
  to authenticated;

grant insert on public.fields to authenticated;
revoke update on public.fields from authenticated;
grant update (name) on public.fields to authenticated;
grant update (name, deleted_at) on public.lots to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'fields'
  ) then
    alter publication supabase_realtime add table public.fields;
  end if;
end;
$$;

create function public.validate_truck_license_plate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.destination_type = 'camion'
    and new.name !~ '^([A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$'
  then
    raise exception 'La patente debe tener el formato ABC123 o AA123BB, sin espacios.';
  end if;
  return new;
end;
$$;

create trigger validate_truck_license_plate_before_write
  before insert or update of destination_type, name on public.destinations
  for each row execute function public.validate_truck_license_plate();

revoke all on function public.validate_truck_license_plate()
  from public, anon, authenticated;
