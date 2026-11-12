-- 1) Patentes de otros países: el formato argentino (ABC123 / AA123BB) pasa a
--    ser una sugerencia de la app. La base solo exige letras y números, sin
--    espacios, de 4 a 10 caracteres.
create or replace function public.validate_truck_license_plate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.destination_type = 'camion'
    and new.name !~ '^[A-Z0-9]{4,10}$'
  then
    raise exception 'La patente tiene que tener entre 4 y 10 letras o números, sin espacios.';
  end if;
  return new;
end;
$$;

-- 2) Un destino fijado se puede cerrar desde cualquiera de los trabajos donde
--    aparece: se guarda desde cuál se cerró.
alter table public.destinations
  add column closed_from_group_id uuid references public.groups (id) on delete set null;

grant update (closed_from_group_id) on public.destinations to authenticated;

-- Al reabrir un destino se borra también desde dónde se había cerrado.
create or replace function public.reopen_destination(p_destination_id uuid)
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
  from public.destinations as d
  where d.id = p_destination_id
    and d.status = 'cerrado'
    and d.deleted_at is null
    and public.is_group_active(d.group_id);

  if v_group_id is null then
    raise exception 'No se encontró el destino cerrado o el trabajo ya no está activo.';
  end if;

  if not public.has_role_for_group(v_group_id, 'cliente') then
    raise exception 'No tenés permiso para reabrir este destino.';
  end if;

  update public.destinations
  set status = 'activo',
      closed_at = null,
      closing_humidity = null,
      closing_humidity_at = null,
      closed_from_group_id = null
  where id = p_destination_id;
end;
$$;
