drop policy "Members can view active groups" on public.groups;
create policy "Members can view their groups"
  on public.groups for select to authenticated
  using (public.is_group_member(id));

drop policy "Members can view active loads in their groups" on public.loads;
create policy "Members can view loads in their groups"
  on public.loads for select to authenticated
  using (
    public.has_role_for_destination(destination_id, 'proveedor')
    or public.has_role_for_destination(destination_id, 'cliente')
  );

create or replace function public.join_group(
  p_invite_code text,
  p_role public.member_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_group_id uuid;
begin
  if v_user_id is null then
    raise exception 'Tenés que iniciar sesión para sumarte a un trabajo.';
  end if;

  if p_invite_code is null
    or char_length(btrim(p_invite_code)) <> 6
    or p_role is null
  then
    raise exception 'Ingresá un código válido y elegí una modalidad.';
  end if;

  if p_role = 'admin' and not public.is_debug_admin() then
    raise exception 'La modalidad de administración solo está disponible para la cuenta de prueba.';
  end if;

  select g.id into v_group_id
  from public.groups as g
  where g.invite_code = upper(btrim(p_invite_code))
    and g.deleted_at is null;

  if v_group_id is null then
    raise exception 'El código de invitación no es válido.';
  end if;

  if exists (
    select 1
    from public.members as m
    where m.group_id = v_group_id
      and m.user_id = v_user_id
  ) then
    raise exception 'Ya formás parte de este trabajo.';
  end if;

  insert into public.members (group_id, user_id, role)
  values (v_group_id, v_user_id, p_role);

  return v_group_id;
end;
$$;

revoke all on function public.join_group(text, public.member_role)
  from public, anon;
grant execute on function public.join_group(text, public.member_role)
  to authenticated;
