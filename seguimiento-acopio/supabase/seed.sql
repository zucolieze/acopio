insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  reauthentication_token,
  is_sso_user
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'observador@test.com',
    extensions.crypt('observador', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"observador"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    false
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'carro@test.com',
    extensions.crypt('carro', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Carro"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    false
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@test.com',
    extensions.crypt('admin', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"],"debug_admin":true}'::jsonb,
    '{"full_name":"admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    false
  )
on conflict (id) do update
set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  reauthentication_token = excluded.reauthentication_token,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now()
from auth.users as u
where u.email in ('observador@test.com', 'carro@test.com', 'admin@test.com')
on conflict (provider_id, provider) do update
set
  identity_data = excluded.identity_data,
  updated_at = now();
