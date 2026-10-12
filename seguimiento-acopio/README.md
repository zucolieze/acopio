# Acopio

CRM mobile-first para registrar las pesadas de cereal en camiones, silos y
silobolsas, y compartir los kilos acumulados con el grupo de trabajo.

## Estado actual

La primera versión funcional implementa el circuito básico de **grupo → destino
activo → pesadas → cierre → historial**. Se inspira en el flujo de “Activos”,
“Nuevo” e “Historial” de Carrero en Equipo, sin copiar su código.

### Ya funciona

- React, TypeScript, Vite y PWA.
- Acceso con correo y contraseña y autocompletado nativo de credenciales.
- Selector de modalidad Observador o Carrero y menú para crear un trabajo,
  entrar a uno existente o sumarse con un código de invitación.
- En modalidad Observador no se permite crear trabajos; puede entrar a trabajos
  existentes o sumarse con un código. La pantalla de modalidades saluda al
  usuario usando la parte del email anterior a `@`.
- El admin de prueba puede cambiar entre la vista observador y carrero sin
  cerrar sesión. La autorización de administración también se valida en Supabase.
- Vista mobile-first con secciones Activos, Nuevo e Historial.
- El proveedor puede abrir un camión, silo o silobolsa con nombre o número,
  registrar pesadas en kilos y cerrar el destino.
- Cada pesada guarda fecha y hora y el usuario que la registró. Se muestra el
  nombre del integrante y el acumulado por destino y grupo.
- Los destinos cerrados y sus pesadas permanecen en el historial.
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

El formulario inicial pide solamente el tipo y nombre o número del destino.
Cada pesada registra kilos, fecha y hora automáticas y quién la cargó. Por ahora
no pide campaña, campo, lote, tipo de cereal, variedad ni humedad, y no incluye
volumen ni exportación CSV. Se priorizó este circuito simple antes de ampliar el
modelo agrícola.

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

Las features actuales son `auth`, `groups` y `loads`. Las campañas, campos y
lotes se incorporarán en sus propias features cuando se implemente ese alcance.

## Desarrollo local

Desde esta carpeta (`seguimiento-acopio/`):

```sh
npm install
npm run dev
```

Vite imprime la URL local del frontend (por defecto,
http://127.0.0.1:5173/).

### Supabase local

Con Docker Desktop instalado y en ejecución:

```sh
npm run db:start
npm run db:reset
npm run dev
```

La configuración local del frontend vive en `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon-key-local-de-supabase>
```

El comando `db:start` levanta los servicios y `db:reset` recrea la base local,
aplicando todas las migraciones y el seed. **`db:reset` borra los datos de
desarrollo existentes.** Supabase Studio está en http://127.0.0.1:54323.

Para detener Supabase local:

```sh
npm run db:stop
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

El cliente tipado está en `src/lib/supabase.ts` y los tipos en
`src/lib/database.types.ts`. La lógica de acceso a datos está en
`src/data/acopio.ts`.

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

## Hoja de ruta del MVP

El alcance original incluye los datos completos de descarga, grupos y roles,
estructura agrícola, seguimiento en tiempo real y exportación. Después del primer
prototipo de kilos, estos son los pasos pendientes:

1. **Consolidar el flujo básico:** validar login con contraseña, menú de
   trabajos, modalidades, comportamiento del admin temporal y permisos RLS con
   las cuentas locales en distintos dispositivos.
  1.1 **Refactor:** la aplicacion comenzara a crecer rapidamente, por lo que es necesario plantear una arquitectura digna de un CRM
2. **Incorporar la estructura agrícola:** pantallas para crear y seleccionar
   campañas, campos y lotes; relacionar los destinos y pesadas con esa
   estructura.
3. **Completar los datos de descarga:** agregar tipo de cereal, variedad, fecha y
   hora editable si hace falta, humedad y demás datos acordados; mantener la
   carga del proveedor breve y con valores recientes prellenados.
4. **Completar la vista del cliente:** filtros de campaña/campo/lote, totales por
   destino y detalle en tiempo real, sin permisos de escritura.
5. **Exportar CSV:** descarga filtrada por campaña, campo y lote; disponible
   solo en la vista de PC.
6. **Preparar el proyecto remoto y deploy:** cargar las variables públicas
   correspondientes en Vercel, vincular Supabase solo cuando se decida publicar,
   revisar las migraciones pendientes y validar el flujo en el dominio real.

El orden original del MVP era setup, conexión Supabase, migraciones, autenticación,
grupos, campañas/campos/lotes, carga de proveedor, vista del cliente y CSV. El
setup, la conexión local, las migraciones y el circuito reducido de
carga/seguimiento ya existen; la estructura agrícola, los campos completos del
modelo original y el CSV siguen pendientes.

## Decisiones de producto y fuera de alcance

- Mobile-first, botones grandes y formularios cortos, para usuarios con poca
  experiencia tecnológica.
- Proveedor registra las pesadas; cliente consulta únicamente.
- El acceso actual usa correo y contraseña para facilitar las pruebas locales.
  El cambio de autenticación de producción deberá revisarse antes de publicar.
- No implementar por ahora modo offline, mapas/GPS, gráficos ni notificaciones
  push.
