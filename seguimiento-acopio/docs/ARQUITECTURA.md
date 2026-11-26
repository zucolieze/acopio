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

## Componentes compartidos (`shared/ui/`)

| Componente | Variantes y props |
|---|---|
| `Boton` | `variante`: `primaria`, `secundaria`, `silenciosa`, `peligro`, `google`, `enlace`, `enlacePeligro`; `tamano`: `chico`, `grande` |
| `Panel` | `como`: elemento a usar (por defecto `section`) |
| `Aviso` | `variante`: `error`, `aviso` |
| `Avisos` (en `Aviso.tsx`) | muestra `error` y `aviso`; el aviso se oculta a los 10 segundos |
| `Pestanas` | `opciones`, `activa`, `alElegir`, `etiqueta` |
| `EtiquetaEstado` | `estado`: `activo`, `cerrado`, `eliminado`, `fijado` |
| `EstadoVacio` | `titulo`, `descripcion` |
| `Marca` | `soloIcono` |
| `IndicacionInstalar` | sin props |
| `PaginaCentrada` | `arriba`: no centra en vertical |
| `EncabezadoSimple` | solo contenido |
| `PieDePagina` | `alFinal`: contenido a la derecha |
| `FormularioApilado` | un `form` en columna |
| `CamposApilados` (en `FormularioApilado.tsx`) | lo mismo sin ser un `form` |
| `Sobretitulo` | línea en mayúsculas arriba de un título |
| `TextoSuave` | `como`: `p` o `span`; `chico` |

El aspecto se elige con props. `className` en `Boton`, `Panel` y `Aviso` es solo
para que quien los usa los ubique (ancho, márgenes). Para combinar clases está
`unirClases` en `shared/utils/`.

## Orden de los estilos

`app/main.tsx` importa `tokens.css` y `base.css` antes que la app. Cada
componente importa su `.module.css` **después** de los componentes que usa, para
que sus reglas de ubicación (por ejemplo el ancho de un `Boton`) ganen sobre las
del componente compartido. Cambiar ese orden altera cómo se ve la app.

Dentro de `features/loads/components/` hay piezas que comparten varias vistas de
cargas: `TarjetaDestino`, `ListaDestinos` y `FilaAcciones`.

## Idioma de los nombres

Todo lo que nombramos nosotros va en español (variables, funciones, tipos,
componentes, clases CSS, tablas, columnas, funciones y políticas SQL), sin
tildes ni `ñ` en identificadores. Queda en inglés lo que impone el lenguaje,
React o una biblioteca, el prefijo `use` de los hooks y los nombres de carpetas
de capa. Roles: `carrero` y `observador`. Ver [GLOSARIO.md](GLOSARIO.md).

## Estado actual

Etapas 1 a 3 hechas: la estructura de carpetas ya es la objetivo, la base de
estilos y los componentes compartidos están en `shared/`, y todas las features
usan CSS Modules (`App.css` ya no existe). Todavía falta:

- Hay tres features: `auth`, `groups` y `loads`. La administración de lotes y
  campos vive dentro de `loads`.
- Lo compartido está en `src/shared/` (`ui/`, `lib/`, `utils/`, `styles/`,
  `types/`).
- `src/app/` tiene `main.tsx`, `App.tsx` y `AppController.tsx`, que compone las
  features y decide qué pantalla mostrar por estado. `index.html` carga
  `/src/app/main.tsx`.
- El alias `@/` apunta a `src/` (en `tsconfig.json` y `vite.config.ts`).
- Algunos módulos todavía usan puntos de corte de `40rem` y `65rem`, además de
  los documentados. Se unifican en la Etapa 4.
- Los nombres están en inglés y los roles en la base y en el código son
  `proveedor` y `cliente`.
- Los tipos de las filas de la base circulan por hooks y componentes.
- Las pantallas se eligen por estado, sin rutas con URL propia.
- Los datos del servidor se cargan con estado manual en los hooks.

Cada etapa del plan cierra una de estas diferencias.
