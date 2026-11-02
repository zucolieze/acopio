-- El admin de prueba deja de depender de un correo fijo escrito en el repo.
-- Solo vale la marca app_metadata.debug_admin = true, que unicamente se puede
-- escribir con la service role o desde el SQL editor del proyecto; una persona
-- no puede ponersela a si misma desde la app ni al registrarse.
create or replace function public.is_debug_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'debug_admin') = 'true',
    false
  );
$$;

revoke all on function public.is_debug_admin() from public, anon;
grant execute on function public.is_debug_admin() to authenticated;
