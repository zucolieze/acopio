# Desarrollo local

## Requisitos

- Windows 10/11, macOS o Linux.
- Node.js LTS y npm. Comprobá la instalación con `node --version` y
  `npm --version`.
- Para usar la base local: Docker Desktop instalado y en ejecución. La CLI de
  Supabase se ejecuta con `npm exec`, no hace falta instalarla globalmente.

## Arrancar la aplicación

Abrí una terminal en la raíz del repositorio y entrá a la carpeta que contiene
el `package.json`:

```powershell
cd .\seguimiento-acopio
npm.cmd install
```

Configurá `.env.local` en `seguimiento-acopio/` con la URL y la clave pública
anon de Supabase:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon-key-local-de-supabase>
```

Para usar Supabase local, primero iniciá Docker Desktop y ejecutá:

```powershell
npm.cmd run db:start
```

En una terminal separada, desde `seguimiento-acopio/`, iniciá Vite:

```powershell
npm.cmd run dev
```

Abrí la URL que Vite muestra en la terminal, normalmente
<http://localhost:5173/>. Si el puerto está ocupado, Vite indicará otro puerto.
La app necesita las dos variables anteriores para crear el cliente de Supabase;
sin ellas muestra un mensaje de configuración.

> **Atención:** si en `.env.local` ponés la URL y la clave del proyecto remoto,
> `localhost` trabaja contra los datos reales del proyecto remoto, los mismos que
> usa el sitio publicado. Para trabajar sin tocarlos, usá Supabase local.

## Si cierro las pestañas y quiero volver

No hace falta mantener abierto VS Code, Chrome ni una terminal para que el
deploy publicado siga funcionando. Para volver a usarlo, abrí
<https://acopio-five.vercel.app/>. Los datos remotos permanecen en Supabase.

Para desarrollar localmente, abrí una terminal en la carpeta del frontend:

```powershell
cd C:\Users\ezequ\OneDrive\Documentos\GitHub\acopio\seguimiento-acopio
npm.cmd install
```

Revisá que exista `.env.local` en `seguimiento-acopio/` con la URL y la clave
pública del proyecto Supabase que quieras usar localmente:

```dotenv
VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_ANON
```

`.env.local` solo configura la ejecución local y no se sube a GitHub. No
reemplaza las variables de Vercel. Para trabajar contra Supabase local, iniciá
Docker Desktop y usá la URL y la clave local que informa `npm.cmd run db:start`.

## Comandos

```powershell
npm.cmd run dev         # servidor de desarrollo
npm.cmd run typecheck   # verificación de tipos
npm.cmd run build       # typecheck + build de producción
npm.cmd run preview     # sirve el build
npm.cmd run db:start    # inicia Supabase local
npm.cmd run db:stop     # detiene Supabase local
npm.cmd run db:reset    # recrea la base LOCAL (borra los datos locales)
npm.cmd run db:push     # publica migraciones en el proyecto remoto vinculado
npm.cmd run db:types    # regenera src/shared/lib/database.types.ts desde la base LOCAL
```

Antes de enviar cambios a GitHub: `npm.cmd run typecheck` y
`npm.cmd run build`.

`db:push` es para publicar migraciones en un proyecto remoto vinculado. No se
ejecuta sin tener claro el proyecto remoto y sin un backup: ver
[DEPLOY.md](DEPLOY.md).

## Migraciones de Supabase local

Para aplicar únicamente las migraciones pendientes, sin borrar los datos
locales:

```powershell
npm.cmd exec --yes supabase -- migration up --local
npm.cmd exec --yes supabase -- db lint --local
```

`npm.cmd run db:reset` recrea la base y vuelve a cargar migraciones y seed.
**Este comando borra los datos de desarrollo existentes.** Supabase Studio está
en <http://127.0.0.1:54323>. Para detener Supabase local:

```powershell
npm.cmd run db:stop
```

## Esquema y migraciones

Las migraciones en `supabase/migrations/` son la fuente de verdad. El esquema
solo cambia con una migración nueva, probada primero en local; nunca se modifica
a mano desde el panel de Supabase. En orden:

| Migración | Qué agrega |
|---|---|
| `20261011190000_create_initial_schema.sql` | Perfiles, grupos, miembros, campañas, campos, lotes, descargas, funciones para crear y unirse a grupos y políticas RLS iniciales |
| `20261011200000_add_active_destinations.sql` | Destinos activos y cerrados, pesadas asociadas al destino, políticas del flujo simplificado y suscripción Realtime |
| `20261012100000_enable_debug_admin_role.sql` y `20261012100100_secure_debug_admin_role.sql` | Rol admin de prueba y comprobación de identidad y metadata del usuario en políticas y RPC |
| `20261017100000_expand_storage_workflow.sql` | Lotes asociados a destinos, capacidad de camiones, humedades de inicio y cierre, bajas lógicas, auditoría y permisos de edición |
| `20261017120000_preserve_soft_deleted_rows.sql` | Consulta del historial auditado de elementos dados de baja y bloqueo de invitaciones a trabajos borrados |
| `20261017130000_realtime_work_structure.sql` | Realtime para cambios de trabajos y lotes |
| `20261018100000_observer_work_corrections.sql` | Correcciones de campos y lotes por el observador, auditoría de campos, reasignación del responsable de una pesada, validación de patentes y Realtime de campos |
| `20261102100000_harden_debug_admin.sql` | El admin de prueba depende solo de la marca `debug_admin` del servidor, sin correo fijo |
| `20261104100000_add_lot_cereal.sql` y `20261105100000_lot_cereal_editable.sql` | Cereal del lote y permiso para editarlo |
| `20261105110000_restore_deleted_destination.sql` | Función para restaurar un destino eliminado |
| `20261107100000_lots_flow_and_yield.sql` | Sin lote automático, hectáreas del lote y formato fijo de humedad |
| `20261107110000_field_is_the_work.sql` | El campo se crea con el trabajo y toma su nombre |
| `20261108100000_loads_per_lot_and_reopen.sql` | Cada pesada guarda su lote y función para reabrir un destino cerrado |
| `20261108110000_prevent_cereal_mixing.sql` | Control en la base para no mezclar cereales en un destino |
| `20261112100000_pinned_destinations_and_archive.sql` | Destinos fijados entre trabajos, edición de destinos por el observador y trabajos archivados |
| `20261112110000_foreign_plates_and_closed_from.sql` | Patentes de otros países y desde qué trabajo se cerró un destino |
| `20261118100000_reopen_with_new_humidity.sql` | Al reactivar un silo se carga una humedad inicial nueva y se conservan las anteriores |
| `20261118110000_anyone_can_restore.sql` | Cualquier integrante del trabajo puede restaurar y reactivar destinos (temporal) |

El cliente tipado está en `src/shared/lib/supabase.ts` y los tipos en
`src/shared/lib/database.types.ts` (se regeneran con `npm.cmd run db:types`, con
la base local iniciada). El acceso a datos está separado por feature en
`src/features/auth/model/`, `src/features/groups/model/` y
`src/features/loads/model/`.

Para el nombre de cada objeto, ver [GLOSARIO.md](GLOSARIO.md).
