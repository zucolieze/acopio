# Deploy en Supabase y Vercel

## Direcciones

- Aplicación desplegada: <https://acopio-five.vercel.app/>
- Repositorio: <https://github.com/zucolieze/acopio>
- Carpeta de la aplicación dentro del repositorio: `seguimiento-acopio/`

La URL con `?_vercel_share=...` es un enlace de acceso compartido, no la URL
estable para guardar o distribuir. Usá el dominio normal de Vercel.

El frontend es una PWA estática en Vercel; autenticación, base de datos y
Realtime los presta Supabase. Ver la pantalla de login confirma que el sitio se
sirve, pero para confirmar una conexión funcional también hay que iniciar sesión
con una cuenta remota y probar una operación real.

## Conectar o actualizar el esquema remoto

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

Conservá un backup antes de cambios importantes en el proyecto que ya tenga
datos. Si todavía no vinculaste este repositorio a la base correcta, no ejecutes
`db:push` hasta comprobar el Project Ref.

> **Regla de trabajo:** durante el refactor no se ejecuta nada contra el
> proyecto remoto sin pedirlo antes (ver `CLAUDE.md`).

## Variables de entorno en Vercel

El proyecto de Vercel debe estar conectado al repositorio `zucolieze/acopio`,
con estos ajustes:

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

## Qué ocurre al crear ramas y hacer cambios

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

## Versión visible

El login muestra la versión `0.MM.DD` (mes y día de la compilación, hora de
Argentina). Se arma sola en `vite.config.ts` al compilar; la primera cifra sigue
en 0.
