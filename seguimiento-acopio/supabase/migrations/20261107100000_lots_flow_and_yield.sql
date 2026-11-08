-- 1) Al crear un trabajo solo se crea la campaña: el usuario crea su primer
--    campo y su primer lote (antes se creaban "Campo principal" y "Lote 1").
create or replace function public.ensure_default_work_structure(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.seasons (group_id, name, year)
  values (p_group_id, 'Campaña inicial', extract(year from now())::integer)
  on conflict (group_id, name) do nothing;
end;
$$;

-- 2) Superficie del lote, para calcular el rendimiento (kg/ha y qq/ha).
alter table public.lots
  add column hectares numeric(10, 2) check (hectares is null or hectares > 0);

grant update (name, deleted_at, cereal, hectares) on public.lots to authenticated;

-- 3) Humedad con formato fijo NN.N (de 10.0 a 99.9), para que no se confunda
--    con los kilos. NOT VALID: no revisa los datos de prueba ya cargados.
alter table public.destinations
  add constraint destinations_opening_humidity_format check (
    opening_humidity is null
    or (opening_humidity >= 10 and opening_humidity < 100
        and opening_humidity = round(opening_humidity, 1))
  ) not valid,
  add constraint destinations_closing_humidity_format check (
    closing_humidity is null
    or (closing_humidity >= 10 and closing_humidity < 100
        and closing_humidity = round(closing_humidity, 1))
  ) not valid;
