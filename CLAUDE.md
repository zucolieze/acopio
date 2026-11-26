# Acopio: reglas del proyecto

App para registrar las descargas de cereal (camión, silo, silobolsa) y compartir
los kilos con el grupo de trabajo. Está en `seguimiento-acopio/`: React +
TypeScript + Vite + Supabase, publicada en Vercel. La documentación está en
`seguimiento-acopio/docs/`.

Estas reglas se aplican en cada sesión. El plan de refactor por etapas está en
`plan-refactor-acopio.md`.

## Ramas y trabajo por etapas

- El refactor vive en la rama `RefactorGeneral`. Cada etapa sale de
  `RefactorGeneral` actualizada, en su propia rama `RefactorEtapa<N><Nombre>`
  (por ejemplo `RefactorEtapa1Estructura`), y vuelve a `RefactorGeneral` por
  pull request. `main` no se toca hasta cerrar todo el refactor.
- Una etapa por rama. No mezclar cambios de otras etapas ni "aprovechar" para
  arreglar otras cosas: si ves algo, anotalo en el resumen final.
- No cambiar el comportamiento visible salvo que la etapa lo pida.
- Hacer commits chicos y descriptivos. No hacer push ni merge sin que te lo
  pida.

## Idioma de los nombres

- Todo lo que nombramos nosotros va en español: variables, funciones, tipos,
  componentes, clases CSS, tablas, columnas, funciones y políticas SQL.
- Queda en inglés lo que impone el lenguaje, React o una biblioteca, el prefijo
  `use` de los hooks y los nombres de carpetas de capa (`components/`,
  `hooks/`, `model/`).
- Los identificadores van sin tildes ni `ñ` (`anio`, `descarga`, `humedad`).
- Roles: solo existen `carrero` y `observador`. No usar `proveedor` ni
  `cliente` en código nuevo.
- Los nombres propuestos están en `seguimiento-acopio/docs/GLOSARIO.md`.

## Arquitectura

- Monolito modular por features. `src/app/` (arranque, rutas, providers,
  layout), `src/shared/` (UI, lib, utils, estilos, tipos comunes) y
  `src/features/<feature>/` con `components/`, `hooks/`, `model/` e `index.ts`.
- Una feature solo se importa desde afuera por su `index.ts`. `shared/` nunca
  importa de `features/` ni de `app/`. Las vistas no consultan Supabase
  directamente: solo `model/`.
- Detalle y estado actual en `seguimiento-acopio/docs/ARQUITECTURA.md`.

## Estilos

- CSS Modules: un `.module.css` junto a cada componente y tokens en
  `src/shared/styles/tokens.css`.
- Sin selectores que apunten a clases de otro componente.
- Media queries dentro de cada módulo, con los puntos de corte documentados en
  `docs/ARQUITECTURA.md`.
- Todo lo nuevo tiene que funcionar en celular, tablet y PC.

## Base de datos

- El esquema solo cambia mediante migraciones en `supabase/migrations/`.
- **Nunca** ejecutar `db:push`, `db:reset` contra el remoto, ni nada contra el
  proyecto remoto de Supabase (migraciones, SQL, consultas) sin pedírmelo antes.
  El proyecto remoto tiene datos reales de pruebas y es el mismo que usan
  `localhost` y Vercel.
- Nunca poner contraseñas ni claves secretas en archivos versionados: el
  repositorio es público. Las credenciales de prueba van en
  `seguimiento-acopio/CREDENCIALES.local.md` (ignorado por git).

## Alcance

- No agregar Zod ni pruebas automáticas por ahora.
- No cambiar el modelo de datos ni agregar entidades nuevas salvo que la etapa
  lo pida.

## Antes de dar una etapa por terminada

- `npm.cmd run typecheck` y `npm.cmd run build` sin errores (desde
  `seguimiento-acopio/`).
- Una prueba manual en local de los flujos afectados.
- Actualizar la documentación de `seguimiento-acopio/docs/` que corresponda.
