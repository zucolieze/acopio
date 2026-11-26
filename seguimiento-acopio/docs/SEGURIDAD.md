# Seguridad

## Reglas para credenciales

- En el frontend solo se configuran `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_ANON_KEY`, en `.env.local` localmente y en el entorno de deploy.
- `.env.local` y los archivos temporales de Supabase CLI están excluidos por
  `.gitignore`.
- **Nunca** poner la clave `service_role` ni otra clave secreta en el frontend,
  archivos versionados o variables `VITE_*`.
- El repositorio es **público**: no se guardan contraseñas en archivos
  versionados. Las contraseñas de las cuentas de prueba están en
  `seguimiento-acopio/CREDENCIALES.local.md`, un archivo local ignorado por git.
- No modificar el esquema desde el panel de Supabase: crear una migración y
  aplicarla primero en local.

## Permisos: RLS

Los permisos se aplican en la base con Row Level Security; la interfaz por sí
sola no es una barrera de seguridad. El carrero registra y modifica; el
observador consulta y corrige algunos datos. Hoy, restaurar destinos eliminados
y reactivar destinos cerrados está permitido a cualquier integrante del trabajo
(`20261118110000_anyone_can_restore.sql`): es **temporal** hasta que se definan
las responsabilidades finales y habrá que volver a restringirlo.

## Cuentas de prueba

### Locales

El seed local prepara tres cuentas con contraseñas débiles:
`admin@test.com`, `carro@test.com` y `observador@test.com`. Son exclusivamente
locales: no deben reutilizarse ni crearse en un proyecto remoto. Mailpit
pertenece al Supabase local y no recibe correos del proyecto alojado.

### Proyecto remoto

Se crearon con confirmación de correo ya hecha, para poder probar sin enviar
correos. Las contraseñas **no** se guardan en el repositorio: están en
`seguimiento-acopio/CREDENCIALES.local.md`.

| Cuenta | Correo | Uso |
|---|---|---|
| Admin | `admin-acopio@example.com` | Modalidad oculta (ver más abajo) |
| Carrero | `carrero-acopio@example.com` | Elegir "Carrero": crea el trabajo y carga descargas |
| Observador | `observador-acopio@example.com` | Elegir "Observador": se suma con el código de invitación |

Ingresar con "Prefiero entrar con contraseña". El rol (carrero u observador) no
es de la cuenta: se elige en la pantalla de modalidades al entrar.

## Admin de prueba (solo para el dueño)

La modalidad admin no figura en ninguna lista: aparece únicamente si la cuenta
tiene la marca `debug_admin` en el servidor y, además, después de tocar cinco
veces el saludo "Bienvenido …" de la pantalla de modalidades. La marca no se
puede asignar desde la app. Para dársela a tu cuenta, ejecutá una vez en el
SQL Editor de Supabase (con tu correo real):

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"debug_admin": true}'::jsonb
where email = 'tu-correo@ejemplo.com';
```

Cerrá sesión y volvé a entrar para que el token incluya la marca. Para quitarla:
`raw_app_meta_data - 'debug_admin'`.

Antes de compartir ampliamente el sitio, verificá la configuración de Auth, las
políticas RLS y quién puede crear cuentas (el registro está abierto).

## Pasar a pruebas con usuarios finales (limpiar los datos de prueba)

Pasos para dejar el proyecto remoto sin datos de prueba a la vista y con las
cuentas listas. Hacerlo **antes** de invitar a los usuarios finales. Todo esto
actúa sobre producción y no se puede deshacer.

1. **Qué se conserva y qué se borra.** Los trabajos (`public.groups`) son la raíz
   de los datos: al borrarlos se eliminan en cascada sus miembros, campañas,
   campos, lotes y la auditoría. Las descargas (`loads`) bloquean el borrado de los
   destinos (`on delete restrict`), así que hay que borrarlas antes. Las cuentas
   (`auth.users`) y los perfiles (`public.profiles`) no se tocan.
2. **Revisar qué hay** (opcional, solo lectura), desde esta carpeta:

   ```bash
   npx supabase db query --remote --read-only "select count(*) from public.groups"
   ```

3. **Borrar los datos de prueba.** En el SQL Editor del panel de Supabase, o con
   `npx supabase db query --remote --yes -f archivo.sql`:

   ```sql
   begin;
   delete from public.loads;
   delete from public.destinations;
   delete from public.groups;
   commit;
   ```

4. **Confirmar** que quedaron en cero `groups`, `members`, `seasons`, `fields`,
   `lots`, `destinations`, `loads` y `change_audit`, y que `auth.users` y
   `profiles` conservan las cuentas.
5. **Cuentas de prueba.** El rol (carrero / observador) no es de la cuenta, se
   elige en la app y es por trabajo, así que no hay que preparar nada más:
   el carrero crea el trabajo y comparte el código de invitación, y el observador
   se suma con ese código.
   - Cambiar las contraseñas simples de las cuentas de prueba (o borrar las
     cuentas desde Authentication > Users y crear las definitivas).
   - Quitar la marca de admin de prueba a cualquier cuenta que no sea la tuya
     (`raw_app_meta_data - 'debug_admin'`, ver la sección anterior).
6. **Antes de invitar**: configurar un SMTP propio (el de Supabase solo envía a
   miembros del equipo y con límite por hora), activar Google si se va a usar y
   revisar que el Site URL y las Redirect URLs apunten al dominio de producción
   (ver [ACCESO.md](ACCESO.md)).
7. **Probar de punta a punta** con cuentas nuevas: registro o enlace por correo,
   crear un trabajo como carrero, sumarse como observador con el código y cargar
   una descarga.
