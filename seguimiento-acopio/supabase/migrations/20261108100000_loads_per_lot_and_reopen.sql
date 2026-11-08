-- 1) Cada pesada guarda de qué lote viene. Un mismo destino (camión, silo,
--    silobolsa) puede recibir descargas de distintos lotes del trabajo.
alter table public.loads
  add column lot_id uuid references public.lots (id) on delete restrict;

update public.loads as l
set lot_id = d.lot_id
from public.destinations as d
where d.id = l.destination_id
  and l.lot_id is null;

create function public.validate_load_lot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Si la app no manda el lote, se usa el lote con el que se abrió el destino.
  if new.lot_id is null then
    select d.lot_id into new.lot_id
    from public.destinations as d
    where d.id = new.destination_id;
  end if;

  if not exists (
    select 1
    from public.lots as lot
    join public.fields as f on f.id = lot.field_id
    join public.destinations as d on d.group_id = f.group_id
    where lot.id = new.lot_id
      and d.id = new.destination_id
  ) then
    raise exception 'El lote elegido no pertenece a este trabajo.';
  end if;

  return new;
end;
$$;

create trigger validate_load_lot_before_write
  before insert or update of lot_id on public.loads
  for each row execute function public.validate_load_lot();

alter table public.loads alter column lot_id set not null;

create index loads_lot_id_idx on public.loads (lot_id);

-- 2) El observador puede reabrir un destino cerrado desde el historial.
--    Se borra la humedad de cierre, que se vuelve a cargar al cerrarlo de nuevo.
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
      closing_humidity_at = null
  where id = p_destination_id;
end;
$$;

revoke all on function public.reopen_destination(uuid) from public, anon;
grant execute on function public.reopen_destination(uuid) to authenticated;
