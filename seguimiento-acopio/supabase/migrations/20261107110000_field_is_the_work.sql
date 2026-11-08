-- El campo es el trabajo: al crear un trabajo se crea solo su campaña y su campo
-- (con el nombre del trabajo). El usuario ya no crea campos, solo lotes, y el
-- primer lote lo crea el usuario (no se genera automáticamente).
create or replace function public.ensure_default_work_structure(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_season_id uuid;
  v_name text;
begin
  select g.name into v_name from public.groups as g where g.id = p_group_id;

  insert into public.seasons (group_id, name, year)
  values (p_group_id, 'Campaña inicial', extract(year from now())::integer)
  on conflict (group_id, name) do update set name = excluded.name
  returning id into v_season_id;

  if not exists (select 1 from public.fields as f where f.group_id = p_group_id) then
    insert into public.fields (group_id, season_id, name)
    values (p_group_id, v_season_id, coalesce(v_name, 'Campo'));
  end if;
end;
$$;

-- Trabajos que quedaron sin campo con la migración anterior.
do $$
declare
  v_group_id uuid;
begin
  for v_group_id in
    select g.id from public.groups as g
    where not exists (select 1 from public.fields as f where f.group_id = g.id)
  loop
    perform public.ensure_default_work_structure(v_group_id);
  end loop;
end;
$$;
