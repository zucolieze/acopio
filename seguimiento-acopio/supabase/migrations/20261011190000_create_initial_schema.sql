create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.member_role as enum ('proveedor', 'cliente');
create type public.destination_type as enum ('camion', 'silo', 'silobolsa');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  invite_code text not null unique check (invite_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  year integer not null check (year between 1900 and 2200),
  created_at timestamptz not null default now(),
  unique (group_id, name),
  unique (id, group_id)
);

create table public.fields (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  season_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (season_id, name),
  unique (id, group_id),
  foreign key (season_id, group_id)
    references public.seasons (id, group_id) on delete cascade
);

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (field_id, name)
);

create table public.loads (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots (id) on delete restrict,
  cereal_type text not null check (char_length(btrim(cereal_type)) between 1 and 80),
  variety text not null default '' check (char_length(variety) <= 120),
  date timestamptz not null default now(),
  kg numeric(12, 2) not null check (kg > 0),
  humidity numeric(5, 2) not null check (humidity between 0 and 100),
  destination_type public.destination_type not null,
  destination_name text not null check (char_length(btrim(destination_name)) between 1 and 120),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index members_user_id_group_id_idx on public.members (user_id, group_id);
create index seasons_group_id_idx on public.seasons (group_id);
create index fields_group_id_season_id_idx on public.fields (group_id, season_id);
create index lots_field_id_idx on public.lots (field_id);
create index loads_lot_id_date_idx on public.loads (lot_id, date desc);
create index loads_created_by_idx on public.loads (created_by);

create function public.is_group_member(p_group_id uuid)
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
  );
$$;

create function public.has_role_for_group(
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
      and m.role = p_role
  );
$$;

create function public.has_role_for_field(
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
      and m.role = p_role
  );
$$;

create function public.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_profile_id = (select auth.uid())
    or exists (
      select 1
      from public.members as viewer
      join public.members as profile_member
        on profile_member.group_id = viewer.group_id
      where viewer.user_id = (select auth.uid())
        and profile_member.user_id = p_profile_id
    );
$$;

create function public.has_role_for_lot(
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
      and m.role = p_role
  );
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 120), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_profile_updated_at
  before update on public.profiles
  for each row execute function public.set_profile_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name)
select
  u.id,
  nullif(left(btrim(u.raw_user_meta_data ->> 'full_name'), 120), '')
from auth.users as u
on conflict (id) do nothing;

create function public.create_group(
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
    raise exception 'Tenés que iniciar sesión para crear un grupo.';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then
    raise exception 'El nombre del grupo debe tener entre 1 y 100 caracteres.';
  end if;

  if p_role is null then
    raise exception 'Elegí un rol válido para el grupo.';
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

create function public.join_group(
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
    raise exception 'Tenés que iniciar sesión para unirte a un grupo.';
  end if;

  if p_invite_code is null
    or char_length(btrim(p_invite_code)) <> 6
    or p_role is null
  then
    raise exception 'Ingresá un código válido y elegí un rol.';
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
    raise exception 'Ya formás parte de este grupo.';
  end if;

  insert into public.members (group_id, user_id, role)
  values (v_group_id, v_user_id, p_role);

  return v_group_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.seasons enable row level security;
alter table public.fields enable row level security;
alter table public.lots enable row level security;
alter table public.loads enable row level security;

create policy "Profiles are visible to the user and their group"
  on public.profiles for select to authenticated
  using (public.can_view_profile(id));

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Members can view their groups"
  on public.groups for select to authenticated
  using (public.is_group_member(id));

create policy "Members can view their group roster"
  on public.members for select to authenticated
  using (public.is_group_member(group_id));

create policy "Members can view group seasons"
  on public.seasons for select to authenticated
  using (public.is_group_member(group_id));

create policy "Providers can create group seasons"
  on public.seasons for insert to authenticated
  with check (public.has_role_for_group(group_id, 'proveedor'));

create policy "Providers can update group seasons"
  on public.seasons for update to authenticated
  using (public.has_role_for_group(group_id, 'proveedor'))
  with check (public.has_role_for_group(group_id, 'proveedor'));

create policy "Providers can delete group seasons"
  on public.seasons for delete to authenticated
  using (public.has_role_for_group(group_id, 'proveedor'));

create policy "Members can view group fields"
  on public.fields for select to authenticated
  using (public.is_group_member(group_id));

create policy "Providers can create group fields"
  on public.fields for insert to authenticated
  with check (public.has_role_for_group(group_id, 'proveedor'));

create policy "Providers can update group fields"
  on public.fields for update to authenticated
  using (public.has_role_for_group(group_id, 'proveedor'))
  with check (public.has_role_for_group(group_id, 'proveedor'));

create policy "Providers can delete group fields"
  on public.fields for delete to authenticated
  using (public.has_role_for_group(group_id, 'proveedor'));

create policy "Members can view lots in their groups"
  on public.lots for select to authenticated
  using (public.has_role_for_field(field_id, 'cliente')
    or public.has_role_for_field(field_id, 'proveedor'));

create policy "Providers can create lots in their groups"
  on public.lots for insert to authenticated
  with check (public.has_role_for_field(field_id, 'proveedor'));

create policy "Providers can update lots in their groups"
  on public.lots for update to authenticated
  using (public.has_role_for_field(field_id, 'proveedor'))
  with check (public.has_role_for_field(field_id, 'proveedor'));

create policy "Providers can delete lots in their groups"
  on public.lots for delete to authenticated
  using (public.has_role_for_field(field_id, 'proveedor'));

create policy "Members can view loads in their groups"
  on public.loads for select to authenticated
  using (
    public.has_role_for_lot(lot_id, 'proveedor')
    or public.has_role_for_lot(lot_id, 'cliente')
  );

create policy "Providers can create loads in their groups"
  on public.loads for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.has_role_for_lot(lot_id, 'proveedor')
  );

create policy "Providers can update their own loads"
  on public.loads for update to authenticated
  using (
    created_by = (select auth.uid())
    and public.has_role_for_lot(lot_id, 'proveedor')
  )
  with check (
    created_by = (select auth.uid())
    and public.has_role_for_lot(lot_id, 'proveedor')
  );

create policy "Providers can delete their own loads"
  on public.loads for delete to authenticated
  using (
    created_by = (select auth.uid())
    and public.has_role_for_lot(lot_id, 'proveedor')
  );

revoke all on public.profiles, public.groups, public.members,
  public.seasons, public.fields, public.lots, public.loads
  from public, anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.groups, public.members to authenticated;
grant select, insert, update, delete on public.seasons, public.fields,
  public.lots, public.loads to authenticated;

revoke all on type public.member_role, public.destination_type from public, anon;
grant usage on type public.member_role, public.destination_type to authenticated;

revoke all on function public.is_group_member(uuid) from public, anon;
revoke all on function public.has_role_for_group(uuid, public.member_role) from public, anon;
revoke all on function public.has_role_for_field(uuid, public.member_role) from public, anon;
revoke all on function public.can_view_profile(uuid) from public, anon;
revoke all on function public.has_role_for_lot(uuid, public.member_role) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_profile_updated_at() from public, anon, authenticated;
revoke all on function public.create_group(text, public.member_role) from public, anon;
revoke all on function public.join_group(text, public.member_role) from public, anon;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.has_role_for_group(uuid, public.member_role) to authenticated;
grant execute on function public.has_role_for_field(uuid, public.member_role) to authenticated;
grant execute on function public.can_view_profile(uuid) to authenticated;
grant execute on function public.has_role_for_lot(uuid, public.member_role) to authenticated;
grant execute on function public.create_group(text, public.member_role) to authenticated;
grant execute on function public.join_group(text, public.member_role) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    raise exception 'No existe la publicación supabase_realtime en este proyecto.';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'loads'
  ) then
    alter publication supabase_realtime add table public.loads;
  end if;
end;
$$;
