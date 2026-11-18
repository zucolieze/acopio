-- Al reactivar un silo o silobolsa se carga una humedad inicial nueva y las
-- humedades anteriores (inicial y de cierre) se conservan para calcular el
-- promedio. Cada vez que se reabre se agrega una entrada al historial.
alter table public.destinations
  add column humidity_history jsonb not null default '[]'::jsonb
    check (jsonb_typeof(humidity_history) = 'array');

drop function public.reopen_destination(uuid);

create function public.reopen_destination(
  p_destination_id uuid,
  p_opening_humidity numeric default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
  v_destination public.destinations%rowtype;
begin
  select d.*
  into v_destination
  from public.destinations as d
  where d.id = p_destination_id
    and d.status = 'cerrado'
    and d.deleted_at is null
    and public.is_group_active(d.group_id);

  if v_destination.id is null then
    raise exception 'No se encontró el destino cerrado o el trabajo ya no está activo.';
  end if;

  v_group_id := v_destination.group_id;

  if not public.has_role_for_group(v_group_id, 'cliente') then
    raise exception 'No tenés permiso para reabrir este destino.';
  end if;

  if v_destination.destination_type = 'camion' then
    update public.destinations
    set status = 'activo',
        closed_at = null,
        closed_from_group_id = null
    where id = p_destination_id;
    return;
  end if;

  if p_opening_humidity is null
    or p_opening_humidity < 10
    or p_opening_humidity >= 100
    or p_opening_humidity <> round(p_opening_humidity, 1)
  then
    raise exception 'Ingresá la humedad inicial nueva con dos cifras, por ejemplo 12 o 12.5.';
  end if;

  update public.destinations
  set status = 'activo',
      closed_at = null,
      closed_from_group_id = null,
      humidity_history = humidity_history || jsonb_build_array(
        jsonb_build_object(
          'opening', v_destination.opening_humidity,
          'opening_at', v_destination.opening_humidity_at,
          'closing', v_destination.closing_humidity,
          'closing_at', v_destination.closing_humidity_at,
          'closed_at', v_destination.closed_at
        )
      ),
      opening_humidity = p_opening_humidity,
      opening_humidity_at = now(),
      closing_humidity = null,
      closing_humidity_at = null
  where id = p_destination_id;
end;
$$;

revoke all on function public.reopen_destination(uuid, numeric) from public, anon;
grant execute on function public.reopen_destination(uuid, numeric) to authenticated;
