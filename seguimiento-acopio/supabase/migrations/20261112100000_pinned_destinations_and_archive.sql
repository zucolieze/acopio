-- Destinos fijados entre trabajos, observador que edita destinos y trabajos
-- archivados.

-- 1) Destino fijado: un destino activo que el carrero "fija" aparece en todos
--    sus trabajos y puede recibir descargas de lotes de cualquiera de ellos
--    (por ejemplo, una bolsa que se llena con lotes de dos campos).
alter table public.destinations
  add column pinned boolean not null default false;

grant update (pinned) on public.destinations to authenticated;

-- Ayudantes (security definer para no chocar con RLS al consultarse entre sí).
create function public.lot_group_id(p_lot_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select f.group_id
  from public.lots as lot
  join public.fields as f on f.id = lot.field_id
  where lot.id = p_lot_id;
$$;

-- ¿El usuario es miembro del trabajo al que pertenece el lote?
create function public.is_member_of_lot_group(p_lot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_group_member(public.lot_group_id(p_lot_id));
$$;

-- ¿El destino recibió descargas de lotes de algún trabajo del usuario?
create function public.destination_has_my_lots(p_destination_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.loads as l
    where l.destination_id = p_destination_id
      and l.deleted_at is null
      and public.is_member_of_lot_group(l.lot_id)
  );
$$;

-- ¿El lote aparece en descargas de destinos de algún trabajo del usuario?
create function public.lot_used_in_my_destinations(p_lot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.loads as l
    join public.destinations as d on d.id = l.destination_id
    where l.lot_id = p_lot_id
      and l.deleted_at is null
      and public.is_group_member(d.group_id)
  );
$$;

-- El lote de una descarga puede ser de otro trabajo solo si el destino está
-- fijado y quien carga es carrero (o admin de prueba) de los dos trabajos.
-- Se mantiene la regla de no mezclar cereales.
create or replace function public.validate_load_lot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_destination_group uuid;
  v_pinned boolean;
  v_lot_group uuid;
begin
  select d.group_id, d.pinned into v_destination_group, v_pinned
  from public.destinations as d
  where d.id = new.destination_id;

  if new.lot_id is null then
    select d.lot_id into new.lot_id
    from public.destinations as d
    where d.id = new.destination_id;
  end if;

  v_lot_group := public.lot_group_id(new.lot_id);

  if v_lot_group is null then
    raise exception 'No se encontró el lote elegido.';
  end if;

  if v_lot_group is distinct from v_destination_group then
    if tg_op = 'INSERT' and not (
      v_pinned
      and public.has_role_for_group(v_lot_group, 'proveedor')
      and public.has_role_for_group(v_destination_group, 'proveedor')
    ) then
      raise exception 'Este destino es de otro trabajo. Fijalo en su trabajo para cargarle lotes de otros campos.';
    end if;
  end if;

  if new.deleted_at is null
    and public.destination_cereal_conflict(new.destination_id, new.lot_id)
  then
    raise exception 'No se pueden mezclar cereales: este destino tiene otro cereal que el lote elegido.';
  end if;

  return new;
end;
$$;

-- Visibilidad entre trabajos: el observador de cada trabajo ve las descargas
-- de sus lotes, el destino donde quedaron y, en los destinos de su trabajo, el
-- nombre del lote y campo de las descargas que vinieron de otro trabajo.
create policy "Members can view loads from their lots"
  on public.loads for select to authenticated
  using (public.is_member_of_lot_group(lot_id));

create policy "Members can view destinations holding their lots"
  on public.destinations for select to authenticated
  using (public.destination_has_my_lots(id));

create policy "Members can view lots loaded into their destinations"
  on public.lots for select to authenticated
  using (public.lot_used_in_my_destinations(id));

create policy "Members can view fields of lots loaded into their destinations"
  on public.fields for select to authenticated
  using (
    exists (
      select 1 from public.lots as lot
      where lot.field_id = fields.id
        and public.lot_used_in_my_destinations(lot.id)
    )
  );

-- 2) El observador también puede editar destinos (nombre, tipo, humedades...).
create policy "Observers can update destinations"
  on public.destinations for update to authenticated
  using (public.has_role_for_group(group_id, 'cliente'))
  with check (public.has_role_for_group(group_id, 'cliente'));

-- 3) Trabajos archivados: salen del menú y del desplegable, pero no se borran.
--    Solo se puede archivar un trabajo sin destinos activos.
alter table public.groups
  add column archived_at timestamptz;

create or replace function public.set_group_archived(p_group_id uuid, p_archived boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (
    public.has_role_for_group(p_group_id, 'proveedor')
    or public.has_role_for_group(p_group_id, 'cliente')
  ) then
    raise exception 'No tenés permiso para archivar este trabajo.';
  end if;

  if p_archived and exists (
    select 1 from public.destinations as d
    where d.group_id = p_group_id
      and d.status = 'activo'
      and d.deleted_at is null
  ) then
    raise exception 'Cerrá o eliminá los destinos activos antes de archivar el trabajo.';
  end if;

  update public.groups
  set archived_at = case when p_archived then now() else null end
  where id = p_group_id;
end;
$$;

revoke all on function public.set_group_archived(uuid, boolean) from public, anon;
grant execute on function public.set_group_archived(uuid, boolean) to authenticated;

revoke all on function public.lot_group_id(uuid) from public, anon;
revoke all on function public.is_member_of_lot_group(uuid) from public, anon;
revoke all on function public.destination_has_my_lots(uuid) from public, anon;
revoke all on function public.lot_used_in_my_destinations(uuid) from public, anon;
grant execute on function public.lot_group_id(uuid) to authenticated;
grant execute on function public.is_member_of_lot_group(uuid) to authenticated;
grant execute on function public.destination_has_my_lots(uuid) to authenticated;
grant execute on function public.lot_used_in_my_destinations(uuid) to authenticated;
