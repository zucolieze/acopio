-- Un destino (camión, silo, silobolsa) nunca puede tener cereales mezclados.
-- El cereal de un destino es el del lote con el que se abrió, y todas sus
-- descargas tienen que venir de lotes con ese mismo cereal. Se controla en la
-- base para que ningún camino (app, edición, SQL) pueda romperlo.

create function public.destination_cereal_conflict(
  p_destination_id uuid,
  p_extra_lot_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct coalesce(lot.cereal, '')) > 1
  from public.lots as lot
  where lot.id in (
    select d.lot_id from public.destinations as d where d.id = p_destination_id
    union
    select l.lot_id from public.loads as l
    where l.destination_id = p_destination_id and l.deleted_at is null
    union
    select p_extra_lot_id where p_extra_lot_id is not null
  );
$$;

-- Al cargar una descarga (o cambiarle el lote).
create or replace function public.validate_load_lot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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

  if new.deleted_at is null
    and public.destination_cereal_conflict(new.destination_id, new.lot_id)
  then
    raise exception 'No se pueden mezclar cereales: este destino tiene otro cereal que el lote elegido.';
  end if;

  return new;
end;
$$;

drop trigger validate_load_lot_before_write on public.loads;
create trigger validate_load_lot_before_write
  before insert or update of lot_id, deleted_at on public.loads
  for each row execute function public.validate_load_lot();

-- Al cambiar el lote de un destino desde "Editar destino".
create function public.validate_destination_cereal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Se compara contra las descargas, no contra el lote anterior del destino.
  if new.lot_id is distinct from old.lot_id and exists (
    select 1
    from public.loads as l
    join public.lots as load_lot on load_lot.id = l.lot_id
    join public.lots as new_lot on new_lot.id = new.lot_id
    where l.destination_id = new.id
      and l.deleted_at is null
      and coalesce(load_lot.cereal, '') <> coalesce(new_lot.cereal, '')
  ) then
    raise exception 'No se pueden mezclar cereales: el lote nuevo tiene otro cereal que las descargas de este destino.';
  end if;
  return new;
end;
$$;

create trigger validate_destination_cereal_before_update
  before update of lot_id on public.destinations
  for each row execute function public.validate_destination_cereal();

-- Al cambiarle el cereal a un lote: no puede quedar mezclado ningún destino
-- que tenga descargas o se haya abierto con ese lote.
create function public.validate_lot_cereal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.cereal is distinct from old.cereal and exists (
    select 1
    from public.destinations as d
    where d.deleted_at is null
      and (
        d.lot_id = new.id
        or exists (
          select 1 from public.loads as l
          where l.destination_id = d.id and l.lot_id = new.id and l.deleted_at is null
        )
      )
      and exists (
        select 1
        from public.lots as other
        where other.id <> new.id
          and coalesce(other.cereal, '') <> coalesce(new.cereal, '')
          and (
            other.id = d.lot_id
            or exists (
              select 1 from public.loads as l
              where l.destination_id = d.id and l.lot_id = other.id and l.deleted_at is null
            )
          )
      )
  ) then
    raise exception 'No se puede cambiar el cereal: quedaría mezclado con otro cereal en un destino.';
  end if;
  return new;
end;
$$;

create trigger validate_lot_cereal_before_update
  before update of cereal on public.lots
  for each row execute function public.validate_lot_cereal();

revoke all on function public.destination_cereal_conflict(uuid, uuid) from public, anon;
grant execute on function public.destination_cereal_conflict(uuid, uuid) to authenticated;
