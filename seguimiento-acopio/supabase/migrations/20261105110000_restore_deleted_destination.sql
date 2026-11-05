-- Un observador (o el admin de prueba) puede restaurar un destino eliminado.
-- El cambio de deleted_at queda registrado por el trigger de auditoria.
create or replace function public.restore_destination(p_destination_id uuid)
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
    and d.deleted_at is not null
    and public.is_group_active(d.group_id);

  if v_group_id is null then
    raise exception 'No se encontró el destino eliminado o el trabajo ya no está activo.';
  end if;

  if not public.has_role_for_group(v_group_id, 'cliente') then
    raise exception 'No tenés permiso para restaurar este destino.';
  end if;

  update public.destinations
  set deleted_at = null
  where id = p_destination_id;
end;
$$;

revoke all on function public.restore_destination(uuid) from public, anon;
grant execute on function public.restore_destination(uuid) to authenticated;
