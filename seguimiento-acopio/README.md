# Acopio

CRM mobile-first para registrar las pesadas de cereal en camiones, silos y
silobolsas, y compartir los kilos acumulados con el grupo de trabajo.

## Estado actual

La primera versión funcional implementa el circuito básico de **grupo → destino
activo → pesadas → cierre → historial**. Se inspira en el flujo de “Activos”,
“Nuevo” e “Historial” de Carrero en Equipo, sin copiar su código.

### Ya funciona

- React, TypeScript, Vite y PWA.
- Acceso simple: botón "Continuar con Google" y enlace por correo (sin
  contraseña); la cuenta se crea sola la primera vez. Como alternativa, correo y
  contraseña con recuperación de contraseña por correo. Si la persona entra sin
  nombre (enlace por correo), la app se lo pide una vez.
- Instalación como PWA desde el enlace del sitio, con botón o instrucciones de
  iPhone en la pantalla de ingreso.
- Selector de modalidad Observador o Carrero y menú para crear un trabajo,
  entrar a uno existente o sumarse con un código de invitación.
- En modalidad Observador no se permite crear trabajos; puede entrar a trabajos
  existentes o sumarse con un código. La pantalla de modalidades saluda al
  usuario usando la parte del email anterior a `@`.
- El admin de prueba puede cambiar entre la vista observador y carrero sin
  cerrar sesión. La autorización de administración también se valida en Supabase.
- Vista mobile-first con secciones Activos, Nuevo e Historial.
- Cada trabajo tiene un lote inicial; el carrero puede crear, renombrar y
  seleccionar otros lotes sin cerrar los destinos abiertos. El observador
  también puede corregir nombres de campos y lotes. Un lote admite varios
  destinos.
- El proveedor puede abrir un camión, silo o silobolsa con nombre o número,
  registrar pesadas en kilos y cerrar el destino.
- Las patentes de camión se normalizan a mayúsculas, sin espacios, y aceptan
  los formatos `ABC123` y `AA123BB`.
- Los camiones requieren un límite configurable. Las pesadas que lo excedan se
  aceptan; la diferencia se muestra en rojo si faltan kilos y en amarillo si se
  supera el límite. El límite puede editarse luego.
- Los silos y silobolsas solicitan humedad inicial al abrirse y humedad de
  cierre al cerrarse; se guardan sus fechas y horas y se informa el promedio.
- Cada pesada guarda fecha y hora y el usuario que la registró. Se muestra el
  nombre del integrante y el acumulado por destino y grupo.
- Carreros pueden corregir kilos y fecha/hora de las pesadas, editar los datos
  de destinos y cambiar el nombre del trabajo. Los observadores pueden corregir
  quién realizó una pesada y cambiar los nombres de campos y lotes.
- Pesadas, destinos, lotes y trabajos se eliminan de forma lógica. Las
  modificaciones y eliminaciones se conservan en una bitácora visible para el
  grupo; los cambios de kilos muestran la diferencia. La selección y gestión de
  campos y lotes queda al final del tablero, y el historial de pesadas se
  mantiene plegado inicialmente.
- Los destinos cerrados y eliminados y sus pesadas permanecen en el historial.
- El cliente puede consultar destinos y pesadas, pero no cargarlos. RLS aplica
  los permisos en la base de datos; la interfaz por sí sola no es una barrera de
  seguridad.
- Supabase Realtime actualiza los destinos y las pesadas del grupo.
- El esquema se administra mediante migraciones SQL; nunca se modifica a mano
  desde el panel de Supabase.

Las migraciones y el seed local preparan las cuentas de prueba
`observador@test.com` (contraseña `observador`), `carro@test.com` (contraseña
`carro`) y `admin@test.com` (contraseña `admin`). Son credenciales
exclusivamente locales: no deben reutilizarse ni habilitarse en un proyecto
remoto.

### Modelo de carga actual

El flujo solicita lote, tipo y nombre o número del destino. Para camiones se
registra el límite; para silos y silobolsas, la humedad inicial y de cierre.
Cada pesada registra kilos, fecha y hora y quién la cargó. La estructura
existente crea automáticamente una campaña, un campo y un lote iniciales para
cada trabajo. Los campos y lotes se pueden administrar desde el final del
tablero; todavía no hay pantallas para administrar campañas.
Siguen pendientes el tipo de cereal, la variedad, volumen, exportación CSV y
otros datos de la operación agrícola.

## Stack y requisitos

- Node.js LTS y npm.
- React + TypeScript + Vite.
- PWA con `vite-plugin-pwa`.
- Supabase: Postgres, Auth con correo y contraseña, Realtime y Row Level
  Security.
- Docker Desktop para ejecutar Supabase localmente.
- Vercel como destino de deploy previsto; el deploy remoto aún no fue validado
  como parte del flujo actual.

## Organización del código

El frontend sigue una arquitectura MVC liviana organizada por features:

- `src/features/*/model/` concentra el acceso a Supabase y las operaciones de
  cada dominio.
- `src/features/*/hooks/` coordina estado, acciones y efectos de cada feature
  (controladores).
- `src/features/*/components/` contiene vistas enfocadas en renderizar datos y
  delegar acciones mediante props.
- `src/components/ui/`, `src/types/` y `src/utils/` reúnen piezas compartidas.
- `src/app/AppController.tsx` compone las features y decide qué pantalla mostrar;
  `src/App.tsx` es el punto de composición de la aplicación.

Las features actuales son `auth`, `groups` y `loads`. La administración de lotes
se integra por ahora en `loads`; las pantallas completas de campañas y campos
podrán extraerse a features propias cuando se amplíe ese alcance.

## Desarrollo local

### Requisitos

- Windows 10/11, macOS o Linux.
- Node.js LTS y npm. Comprobá la instalación con `node --version` y
  `npm --version`.
- Para usar la base local: Docker Desktop instalado y en ejecución. La CLI de
  Supabase se ejecuta con `npm exec`, no hace falta instalarla globalmente.

### Arrancar la aplicación

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
http://localhost:5173/. Si el puerto está ocupado, Vite indicará otro puerto.
La app necesita las dos variables anteriores para crear el cliente de
Supabase; sin ellas muestra un mensaje de configuración.

### Migraciones de Supabase local

Para aplicar únicamente las migraciones pendientes, sin borrar los datos
locales:

```powershell
npm.cmd exec --yes supabase -- migration up --local
```

`npm.cmd run db:reset` recrea la base y vuelve a cargar migraciones y seed.
**Este comando borra los datos de desarrollo existentes.** Supabase Studio está
en http://127.0.0.1:54323.

Para detener Supabase local:

```powershell
npm.cmd run db:stop
```

Comandos disponibles:

```sh
npm run typecheck
npm run build
npm run preview
npm run db:push
```

`db:push` es para publicar migraciones en un proyecto remoto vinculado. El
proyecto remoto de Acopio **todavía no está vinculado ni fue actualizado**.
Desarrollar y probar en local no requiere vincularlo.

## Esquema y seguridad

Las migraciones en `supabase/migrations/` son la fuente de verdad:

- `20261011190000_create_initial_schema.sql`: perfiles, grupos, miembros,
  campañas, campos, lotes, descargas, funciones para crear/unirse a grupos y
  políticas RLS iniciales.
- `20261011200000_add_active_destinations.sql`: destinos activos/cerrados,
  pesadas asociadas al destino, políticas para el flujo simplificado y
  suscripción Realtime.
- `20261012100000_enable_debug_admin_role.sql` y
  `20261012100100_secure_debug_admin_role.sql`: rol admin de prueba y
  comprobación de identidad y metadata del usuario en las políticas/RPC.
- `20261017100000_expand_storage_workflow.sql`: lotes asociados a destinos,
  capacidad de camiones, humedades de inicio y cierre, bajas lógicas, auditoría
  y permisos de edición.
- `20261017120000_preserve_soft_deleted_rows.sql`: permite consultar el historial
  auditado de elementos dados de baja y bloquea invitaciones a trabajos borrados.
- `20261017130000_realtime_work_structure.sql`: habilita Realtime para cambios
  de trabajos y lotes.
- `20261018100000_observer_work_corrections.sql`: habilita correcciones de
  campos y lotes para observadores, auditoría de campos, reasignación del
  responsable de una pesada, validación de patentes y actualizaciones Realtime
  de campos.

El cliente tipado está en `src/lib/supabase.ts` y los tipos en
`src/lib/database.types.ts`. El acceso a datos está separado por feature en
`src/features/auth/model/`, `src/features/groups/model/` y
`src/features/loads/model/`.

Reglas para credenciales:

- En el frontend solo se configuran `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_ANON_KEY`, en `.env.local` localmente y en el entorno de deploy
  cuando se prepare.
- `.env.local` y los archivos temporales de Supabase CLI están excluidos por
  `.gitignore`.
- **Nunca** poner la clave `service_role` ni otra clave secreta en el frontend,
  archivos versionados o variables `VITE_*`.
- No modificar el esquema desde el panel de Supabase: crear una migración y
  aplicarla primero en local.

## Continuación del desarrollo

El alcance original y las nuevas necesidades del CRM siguen guiando el
desarrollo. El circuito básico, los lotes, la capacidad de camiones, las
humedades de almacenamiento y la bitácora de cambios ya forman parte del
prototipo. Los próximos pasos son:

1. **Avisos de datos pendientes:** definir qué significa “fin de jornada” y qué
   campos incompletos deben generar un aviso dentro de la aplicación.
2. **Completar la estructura agrícola:** habilitar la selección y administración
   de campañas y campos, y vincular lotes, destinos y pesadas a ellos.
3. **Completar los datos de descarga:** agregar tipo de cereal, variedad y otros
   datos acordados, manteniendo breve la carga del carrero.
4. **Completar la vista del observador:** filtros por campaña, campo y lote,
   totales por destino y detalle en tiempo real, sin permisos de escritura.
5. **Exportar CSV:** descarga filtrada por campaña, campo y lote, disponible
   solo en la vista de PC.
6. **Validar seguridad y despliegue:** probar RLS y roles con las cuentas
   locales y revisar el flujo remoto con cuentas de prueba antes de sumar
   usuarios del piloto.

El objetivo de evolución es mantener un monolito modular y portable que pueda
servir como base para forks: dominio organizado por features, acceso a datos
aislado en modelos/adaptadores y vistas que no consultan Supabase directamente.
Se priorizan cambios incrementales y simples antes que una plataforma genérica.

## Decisiones de producto y fuera de alcance

- Mobile-first, botones grandes y formularios cortos, para usuarios con poca
  experiencia tecnológica.
- Proveedor registra las pesadas; cliente consulta únicamente.
- El acceso actual usa correo y contraseña para facilitar las pruebas locales.
  El pedido inicial de OTP por email queda pendiente de revisarse antes de
  publicar; no confundirlo con las credenciales locales de prueba.
- No implementar por ahora modo offline, mapas/GPS, gráficos ni notificaciones
  push.

## Deploy en Supabase y Vercel

### Direcciones del prototipo

- Aplicación desplegada: <https://acopio-five.vercel.app/>
- Repositorio: <https://github.com/zucolieze/acopio>
- Carpeta de la aplicación dentro del repositorio: `seguimiento-acopio/`

La URL con `?_vercel_share=...` es un enlace de acceso compartido, no la URL
estable para guardar o distribuir. Usá el dominio normal de Vercel.

El frontend es una PWA estática en Vercel; autenticación, base de datos y
Realtime los presta Supabase. Ver la pantalla de login confirma que el sitio se
sirve, pero para confirmar una conexión funcional también hay que iniciar sesión
con una cuenta remota y probar una operación real.

### Si cierro las pestañas y quiero volver

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

No reemplaces las variables remotas de Vercel editando este archivo: `.env.local`
solo configura la ejecución local y no se sube a GitHub. Para trabajar contra
Supabase local, iniciá Docker Desktop y usá la URL y la clave local que informa
`npm.cmd run db:start`.

Luego podés iniciar Vite:

```powershell
npm.cmd run dev
```

Para comprobar cambios antes de enviarlos a GitHub:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

### Conectar o actualizar el esquema remoto

Las migraciones versionadas en `supabase/migrations/` son la fuente de verdad.
Cuando se agrega una migración nueva, probala primero en local con:

```powershell
npm.cmd exec --yes supabase -- migration up --local
npm.cmd exec --yes supabase -- db lint --local
```

Para la primera conexión de la CLI o si cambiaste de proyecto remoto:

```powershell
npm.cmd exec --yes supabase -- login
npm.cmd exec --yes supabase -- link --project-ref TU_PROJECT_REF
```

Antes de publicar migraciones, verificá el proyecto vinculado y los cambios
pendientes:

```powershell
npm.cmd exec --yes supabase -- migration list --linked
npm.cmd exec --yes supabase -- db push --dry-run
```

Si el Project Ref no es el esperado o el dry-run no coincide con las
migraciones del repositorio, frená y revisá el vínculo. Si es correcto, aplicá
las migraciones:

```powershell
npm.cmd run db:push
```

`db push` actualiza el esquema remoto con las migraciones pendientes; no copia
los datos de la base local ni sus cuentas del seed. No uses `db:reset` contra
un proyecto remoto: el reset es destructivo y está pensado para recrear la
base local. No publiques `supabase/seed.sql` ni las contraseñas locales de
prueba en el proyecto remoto.

Si todavía no vinculaste este repositorio a la base correcta, no ejecutes
`db:push` hasta comprobar el Project Ref. Conservá un backup antes de cambios
importantes en el proyecto que ya tenga datos.

### Variables de entorno en Vercel

El proyecto de Vercel debe estar conectado al repositorio
`zucolieze/acopio`, con estos ajustes:

- **Root Directory:** `seguimiento-acopio`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

En **Settings → Environment Variables** deben estar configuradas:

- `VITE_SUPABASE_URL`: URL `https://TU_PROJECT_REF.supabase.co` del proyecto
  remoto que usará el sitio.
- `VITE_SUPABASE_ANON_KEY`: clave pública anon/publishable del mismo proyecto.

Asigná las variables a **Preview** para probar deployments de ramas y a
**Production** cuando quieras que el dominio estable use ese proyecto. Los
entornos tienen valores independientes: verificá que URL y clave pertenezcan al
mismo Supabase. Vite incorpora estas variables durante el build, así que luego
de agregarlas o modificarlas hay que generar un deploy nuevo o hacer
**Redeploy** del deployment correspondiente. Editar `.env.local` no cambia lo
que ya está publicado.

La clave anon/publishable está diseñada para el cliente web y el acceso queda
protegido mediante RLS. Nunca uses `service_role` en el frontend, en archivos
versionados o como una variable `VITE_*`.

### Qué ocurre al crear ramas y hacer cambios

Con la integración GitHub–Vercel activa, los deployments se generan al **hacer
push** al repositorio:

- Un commit hecho solo en tu computadora no dispara un deploy.
- Al hacer push de una rama conectada, Vercel crea o actualiza un deployment
  **Preview** para esa rama/commit y muestra su URL.
- Al hacer merge o push a la **Production Branch** configurada en Vercel
  (normalmente `main`), se genera un deployment de **Production** para el
  dominio principal.
- Un nuevo push actualiza el deployment de esa rama automáticamente; no hace
  falta pulsar Redeploy en el flujo habitual.
- **Redeploy** sirve para reconstruir un commit ya desplegado, por ejemplo
  después de cambiar variables de entorno. No reemplaza el push cuando cambió
  el código.

Flujo recomendado para una funcionalidad:

1. Crear una rama para el cambio y trabajar en ella.
2. Ejecutar `npm.cmd run typecheck` y `npm.cmd run build`.
3. Crear un commit y hacer push de la rama a GitHub.
4. Probar el Preview de Vercel, incluyendo login, escritura, lectura y Realtime
   con cuentas de prueba del proyecto Supabase de pruebas.
5. Integrar la rama a la Production Branch solo después de revisar el Preview.

Las ramas no crean automáticamente una base Supabase separada: si Preview y
Production usan el mismo Supabase, ambos deployments comparten usuarios y datos.
Para probar migraciones o cambios riesgosos, es preferible configurar un
Supabase de pruebas separado y asignar sus variables al entorno Preview.

### Cuentas, autenticación y seguridad del prototipo

Formas de entrar: Google, enlace por correo y correo con contraseña. Mailpit
pertenece al Supabase local y no recibe correos del proyecto alojado. Las tres
cuentas del seed (`admin@test.com`, `carro@test.com` y `observador@test.com`)
y sus contraseñas débiles son solo para uso local; no las crees en el remoto.

#### Configurar el ingreso en el proyecto remoto (una sola vez)

1. **URLs**: Supabase > Authentication > URL Configuration. Poné como *Site URL*
   el dominio de Vercel y agregá en *Redirect URLs* ese dominio y
   `http://localhost:5173`. Sin esto los enlaces de correo y Google fallan.
2. **Google**: en Google Cloud Console creá un *OAuth client ID* (tipo Web) con
   la *Authorized redirect URI* que muestra Supabase en Authentication >
   Sign In / Providers > Google. Pegá Client ID y Secret ahí y activá Google.
3. **Correos**: el servicio de correo por defecto de Supabase tiene un límite
   bajo por hora. Para uso real configurá un SMTP propio (Authentication >
   SMTP Settings). Los enlaces son de un solo uso y algunos antivirus de correo
   los "gastan" al revisarlos; si pasa, la app muestra "El enlace venció" y se
   pide otro.
4. **Plantilla**: en Authentication > Email Templates podés traducir los
   correos "Magic Link" y "Reset Password" al español.

#### Cuentas de prueba del proyecto remoto

Se crearon con confirmación de correo ya hecha, para poder probar sin enviar
correos. Las contraseñas **no** se guardan en el repositorio (es público): están
en `seguimiento-acopio/CREDENCIALES.local.md`, un archivo local ignorado por git.

| Cuenta | Correo | Uso |
|---|---|---|
| Admin | `admin-acopio@example.com` | Modalidad oculta (ver más abajo) |
| Carrero | `carrero-acopio@example.com` | Elegir "Carrero": crea el trabajo y carga pesadas |
| Observador | `observador-acopio@example.com` | Elegir "Observador": se suma con el código de invitación |

Ingresar con "Prefiero entrar con contraseña". El rol (carrero u observador) no
es de la cuenta: se elige en la pantalla de modalidades al entrar.

#### Admin de prueba (solo para el dueño)

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

### Pasar a pruebas con usuarios finales (limpiar los datos de prueba)

Pasos para dejar el proyecto remoto sin datos de prueba a la vista y con las
cuentas listas. Hacerlo **antes** de invitar a los usuarios finales. Todo esto
actúa sobre producción y no se puede deshacer.

1. **Qué se conserva y qué se borra.** Los trabajos (`public.groups`) son la raíz
   de los datos: al borrarlos se eliminan en cascada sus miembros, campañas,
   campos, lotes y la auditoría. Las pesadas (`loads`) bloquean el borrado de los
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
   revisar que el Site URL y las Redirect URLs apunten al dominio de producción.
7. **Probar de punta a punta** con cuentas nuevas: registro o enlace por correo,
   crear un trabajo como carrero, sumarse como observador con el código y cargar
   una pesada.
