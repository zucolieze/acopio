# Arquitectura

Monolito modular por features, pensado para ser portable y fácil de mantener.
Las reglas de abajo son el **objetivo** del refactor por etapas
(`plan-refactor-acopio.md`); la sección "Estado actual" dice dónde estamos.

## Estructura objetivo

```
src/
  app/          arranque, rutas, providers y layout general
  shared/
    ui/         componentes reutilizables (botón, panel, aviso...)
    lib/        cliente de Supabase y tipos de la base
    utils/      funciones chicas sin dependencia de dominio
    styles/     tokens.css y base.css
    types/      tipos comunes
  features/
    <feature>/
      components/   vistas: renderizan datos y delegan acciones por props
      hooks/        estado, acciones y efectos de la feature
      model/        único lugar que habla con Supabase
      index.ts      lo único que se puede importar desde afuera
```

## Reglas de importación

- Una feature solo se importa desde afuera por su `index.ts`.
- `shared/` nunca importa de `features/` ni de `app/`.
- `features/` no importa de `app/`.
- Las vistas no consultan Supabase directamente: solo `model/`.
- Hacia arriba de `model/` circulan tipos del dominio, no filas de la base.
- Los imports que cruzan carpetas usan el alias `@/` (a `src/`); dentro de una
  misma feature, imports relativos.

## Capas dentro de una feature

- `model/`: acceso a Supabase y operaciones del dominio.
- `hooks/`: coordina estado, acciones y efectos (los "controladores").
- `components/`: vistas que renderizan y delegan acciones mediante props.

## Estilos

- CSS Modules, un `.module.css` junto a cada componente.
- Tokens (colores, espaciados, radios, sombras, tamaños) en
  `src/shared/styles/tokens.css`.
- Mobile-first: la base es celular, sin media query.
- Puntos de corte (las variables CSS no funcionan dentro de `@media`, por eso
  son valores fijos): tablet desde `42rem` y PC desde `64rem`.
- Sin selectores que apunten a clases de otro componente.

## Idioma de los nombres

Todo lo que nombramos nosotros va en español (variables, funciones, tipos,
componentes, clases CSS, tablas, columnas, funciones y políticas SQL), sin
tildes ni `ñ` en identificadores. Queda en inglés lo que impone el lenguaje,
React o una biblioteca, el prefijo `use` de los hooks y los nombres de carpetas
de capa. Roles: `carrero` y `observador`. Ver [GLOSARIO.md](GLOSARIO.md).

## Estado actual (antes del refactor)

El código todavía no sigue la estructura objetivo:

- Hay tres features: `auth`, `groups` y `loads`. La administración de lotes y
  campos vive dentro de `loads`.
- Lo compartido está en `src/components/ui/`, `src/lib/`, `src/utils/` y
  `src/types/` (no en `src/shared/`).
- `src/app/AppController.tsx` compone las features y decide qué pantalla
  mostrar por estado; `src/App.tsx` y `src/main.tsx` arrancan la app.
- Todos los estilos están en `src/App.css` e `src/index.css` (globales, sin CSS
  Modules).
- Los nombres están en inglés y los roles en la base y en el código son
  `proveedor` y `cliente`.
- Los tipos de las filas de la base circulan por hooks y componentes.
- Las pantallas se eligen por estado, sin rutas con URL propia.
- Los datos del servidor se cargan con estado manual en los hooks.

Cada etapa del plan cierra una de estas diferencias.
