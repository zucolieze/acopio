create function public.is_debug_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select auth.jwt() ->> 'email') = 'admin@test.com'
    and (select auth.jwt() -> 'app_metadata' ->> 'debug_admin') = 'true',
    false
  );
$$;

create or replace function public.has_role_for_group(
  p_group_id uuid,
  p_role public.member_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.members as m
    where m.group_id = p_group_id
      and m.user_id = (select auth.uid())
      and (
        m.role = p_role
        or (m.role = 'admin' and public.is_debug_admin())
      )
  );
$$;

create or replace function public.has_role_for_field(
  p_field_id uuid,
  p_role public.member_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.fields as f
    join public.members as m on m.group_id = f.group_id
    where f.id = p_field_id
      and m.user_id = (select auth.uid())
      and (
        m.role = p_role
        or (m.role = 'admin' and public.is_debug_admin())
      )
  );
$$;

create or replace function public.has_role_for_lot(
  p_lot_id uuid,
  p_role public.member_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lots as l
    join public.fields as f on f.id = l.field_id
    join public.members as m on m.group_id = f.group_id
    where l.id = p_lot_id
      and m.user_id = (select auth.uid())
      and (
        m.role = p_role
        or (m.role = 'admin' and public.is_debug_admin())
      )
  );
$$;

create or replace function public.create_group(
  p_name text,
  p_role public.member_role default 'cliente'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_group_id uuid;
  v_invite_code text;
begin
  if v_user_id is null then
    raise exception 'Tenés que iniciar sesión para crear un trabajo.';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then
    raise exception 'El nombre del trabajo debe tener entre 1 y 100 caracteres.';
  end if;

  if p_role is null then
    raise exception 'Elegí una modalidad válida.';
  end if;

  if p_role = 'admin' and not public.is_debug_admin() then
    raise exception 'La modalidad de administración solo está disponible para la cuenta de prueba.';
  end if;

  loop
    select string_agg(
      substr(
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
        (get_byte(extensions.gen_random_bytes(1), 0) % 32) + 1,
        1
      ),
      ''
      order by char_index
    )
    into v_invite_code
    from generate_series(1, 6) as codes(char_index);

    begin
      insert into public.groups (name, invite_code, created_by)
      values (btrim(p_name), v_invite_code, v_user_id)
      returning id into v_group_id;
      exit;
    exception
      when unique_violation then
        v_group_id := null;
    end;
  end loop;

  insert into public.members (group_id, user_id, role)
  values (v_group_id, v_user_id, p_role);

  return v_group_id;
end;
$$;

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
  where g.invite_code = upper(btrim(p_invite_code));

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

create or replace function public.has_role_for_destination(
  p_destination_id uuid,
  p_role public.member_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.destinations as d
    join public.members as m on m.group_id = d.group_id
    where d.id = p_destination_id
      and m.user_id = (select auth.uid())
      and (
        m.role = p_role
        or (m.role = 'admin' and public.is_debug_admin())
      )
  );
$$;

create or replace function public.can_add_load(p_destination_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.destinations as d
    join public.members as m on m.group_id = d.group_id
    where d.id = p_destination_id
      and d.status = 'activo'
      and m.user_id = (select auth.uid())
      and (
        m.role = 'proveedor'
        or (m.role = 'admin' and public.is_debug_admin())
      )
  );
$$;

revoke all on function public.is_debug_admin() from public, anon;
grant execute on function public.is_debug_admin() to authenticated;
