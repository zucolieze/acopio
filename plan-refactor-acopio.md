# Plan de refactor de Acopio por etapas

Plan para ordenar la arquitectura de Acopio (`zucolieze/acopio`, app en
`seguimiento-acopio/`) de forma que sea fácil de mantener y pueda crecer.
Cada etapa es un prompt independiente para Claude Code y se hace en **su propia
rama**. No se arranca una etapa hasta que la anterior esté integrada en `RefactorGeneral`.

## Cómo usar este archivo

1. Abrí Claude Code en la carpeta del repositorio.
2. Copiá **una sola etapa** (desde su título hasta la siguiente) y pegala como
   mensaje.
3. Al terminar, revisá el resultado: `npm.cmd run typecheck`, `npm.cmd run build`,
   prueba manual en local y, después del push, el Preview de Vercel.
4. Integrá la rama a `RefactorGeneral` y recién ahí pasá a la siguiente etapa.

La Etapa 0 crea un `CLAUDE.md` con las reglas generales. Claude Code lo lee
solo en cada sesión, por eso las etapas siguientes no repiten esas reglas.

## Decisiones ya tomadas

- Se mantiene el **monolito modular por features**.
- Estructura objetivo: `src/app/`, `src/shared/`, `src/features/<feature>/`
  con `components/`, `hooks/`, `model/` e `index.ts`.
- Estilos con **CSS Modules**, tokens en variables CSS y un `.module.css` por
  componente. Se elimina `App.css`.
- **Responsive**: mobile-first, y también usable en tablet y PC.
- Límites entre features verificados con **ESLint**.
- Rutas con **React Router**.
- Datos del servidor con **TanStack Query**, invalidado por Supabase Realtime.
- La capa `model/` devuelve **tipos del dominio**, no filas de la base.
- **Todo lo que nombramos nosotros va en español**: variables, funciones,
  tipos, componentes, clases CSS, tablas, columnas, funciones SQL y políticas.
  Queda en inglés solo lo que impone el lenguaje, el framework o una
  biblioteca (palabras clave, APIs de React, prefijo `use` de los hooks,
  nombres de carpetas de capa como `components/`, `hooks/`, `model/`).
  Público objetivo: Argentina y, a lo sumo, Latinoamérica.
- **Roles: `carrero` y `observador`** en todas partes (código, base de datos,
  interfaz y documentación). `proveedor` y `cliente` dejan de existir.
- **Vistas SQL de lectura como contrato de datos**: la información se expone
  en vistas planas, en español y con unidades explícitas. Sirven para la vista
  de tabla en PC, la exportación a Excel y, en el futuro, para integrar
  monitores de una planta de silos sin depender de las tablas internas.
- **No** se agrega Zod: la validación queda como está hoy.
- **No** se cambia el modelo de datos: no se agregan entidades nuevas
  (planta, organización, etc.). Las vistas de lectura no cambian el modelo.
- **No** se agregan pruebas automáticas por ahora.
- Publicación en **Play Store** como PWA empaquetada (Trusted Web Activity),
  no como app nativa.

## Orden de las etapas

| Etapa | Rama | Riesgo |
|---|---|---|
| 0. Convenciones y documentación | `etapa-00-convenciones` | Bajo |
| 1. Estructura `app/` y `shared/` | `etapa-01-estructura` | Bajo |
| 2. Base de estilos y UI compartida | `etapa-02-estilos-base` | Bajo |
| 3a/3b/3c. CSS Modules por feature | `etapa-03a-css-acceso`, etc. | Bajo |
| 4. Responsive para tablet y PC | `etapa-04-responsive` | Bajo |
| 5. Límites entre features con ESLint | `etapa-05-limites` | Bajo |
| 6. Tipos del dominio y mapeadores | `etapa-06-dominio` | Medio |
| 7. Código del frontend en español | `etapa-07-codigo-es` | Medio |
| 8. Base de datos en español y roles | `etapa-08-base-es` | **Alto** |
| 9. Rutas con React Router | `etapa-09-rutas` | Medio |
| 10. Datos con TanStack Query | `etapa-10-query` | Medio |
| 11. Bases del ingreso con Google | `etapa-11-ingreso-google` | Medio |
| 12. Vista de tabla y exportación | `etapa-12-exportacion` | Medio |
| 13. Preparación para Play Store | `etapa-13-play-store` | Medio |

El orden importa:
- Las etapas 6 y 7 dejan todo el acceso a Supabase concentrado en `model/`,
  y eso hace que el renombrado de la base (Etapa 8) toque pocos archivos.
- El ingreso con Google (11) va después de las rutas (9), porque el regreso
  desde Google cae en una ruta.
- La exportación (12) va después de la base en español (8), para que las
  vistas nazcan con sus nombres definitivos.
- Play Store (13) va al final porque necesita el ingreso y las páginas
  legales de la Etapa 11.

---

## Etapa 0 — Convenciones y documentación

Trabajá en el repositorio de Acopio (app en `seguimiento-acopio/`). Esta es la
Etapa 0 de un refactor por etapas. Creá la rama `etapa-00-convenciones` desde
`RefactorGeneral` actualizado.

**Objetivo:** dejar escritas las reglas del proyecto y ordenar la
documentación. No se cambia código de la aplicación.

1. Creá `CLAUDE.md` en la raíz del repositorio con estas reglas generales:
   - Una etapa por rama. No mezclar cambios de otras etapas ni "aprovechar"
     para arreglar otras cosas: si ves algo, anotalo en el resumen final.
   - No cambiar comportamiento visible salvo que la etapa lo pida.
   - Convención de idioma: todo lo que nombramos va en español (variables,
     funciones, tipos, componentes, clases CSS, tablas, columnas, funciones y
     políticas SQL). Queda en inglés lo que impone el lenguaje, React o una
     biblioteca, el prefijo `use` de los hooks y los nombres de carpetas de
     capa (`components/`, `hooks/`, `model/`). Nombres sin tildes ni `ñ` en
     identificadores (`anio`, `pesada`, `humedad`).
   - Roles: solo existen `carrero` y `observador`. No usar `proveedor` ni
     `cliente` en código nuevo.
   - Arquitectura: monolito modular por features. `src/app/` (arranque,
     rutas, providers, layout), `src/shared/` (UI, lib, utils, estilos, tipos
     comunes) y `src/features/<feature>/` con `components/`, `hooks/`,
     `model/` e `index.ts`. Una feature solo se importa desde afuera por su
     `index.ts`. `shared/` nunca importa de `features/` ni de `app/`. Las
     vistas no consultan Supabase directamente: solo `model/`.
   - Estilos: CSS Modules, un `.module.css` junto a cada componente, tokens
     en `src/shared/styles/tokens.css`. Sin selectores que apunten a clases
     de otro componente. Media queries dentro de cada módulo, con los puntos
     de corte documentados en `docs/ARQUITECTURA.md`. Todo lo nuevo tiene que
     funcionar en celular, tablet y PC.
   - Base de datos: el esquema solo cambia mediante migraciones en
     `supabase/migrations/`. Nunca ejecutar `db:push`, `db:reset` contra el
     remoto, ni nada contra el proyecto remoto de Supabase sin pedírmelo antes.
   - No agregar Zod ni pruebas automáticas por ahora.
   - Antes de dar una etapa por terminada: `npm.cmd run typecheck` y
     `npm.cmd run build` sin errores, y una prueba manual en local de los
     flujos afectados.
   - Hacer commits chicos y descriptivos. No hacer push ni merge sin que te
     lo pida.
   - Al terminar cada etapa, actualizar la documentación de `docs/` que
     corresponda.
2. Dividí el `README.md` de `seguimiento-acopio/` en:
   - `README.md`: qué es la app, estado actual y enlaces a `docs/`. Corto.
   - `docs/DESARROLLO.md`: requisitos, desarrollo local, Supabase local,
     migraciones.
   - `docs/DEPLOY.md`: Vercel, Supabase remoto, variables, ramas y previews.
   - `docs/SEGURIDAD.md`: credenciales, RLS, cuentas de prueba, admin de
     prueba.
   - `docs/ACCESO.md`: cómo se entra a la app (Google, enlace por correo,
     contraseña) y la configuración de Supabase y Google Cloud que hoy está
     en el README.
   - `docs/ARQUITECTURA.md`: estructura de carpetas, capas, reglas de
     importación, estilos, convención de idioma.
   - `docs/HOJA-DE-RUTA.md`: los próximos pasos de producto y lo que queda
     fuera de alcance. Sumá estos objetivos:
     - Datos fáciles de ver en una tabla en PC y de exportar a Excel
       (Etapa 12).
     - A futuro, poder enviar estos datos a monitores de estado de una planta
       de silos, usando las vistas de lectura como contrato (Etapa 12 deja la
       base; la integración queda fuera de este plan).
     - Responsive en celular, tablet y PC (Etapa 4).
     - Publicación en Play Store (etapas 11 y 13).
   - `docs/decisiones/`: un archivo corto por decisión (contexto, decisión,
     consecuencias). Creá uno por cada decisión de la sección "Decisiones ya
     tomadas" de este plan.

   No pierdas información al dividir: todo lo que hoy dice el README tiene que
   quedar en algún archivo.
3. Creá `docs/GLOSARIO.md`: una tabla con cada nombre en inglés que hoy
   existe en el código y en la base (features, tipos, funciones, hooks,
   componentes, tablas, columnas, funciones SQL, políticas) y su nombre
   propuesto en español. Las etapas 7 y 8 lo van a seguir al pie de la letra.
   - Los roles ya están decididos: `proveedor` → `carrero` y `cliente` →
     `observador`, en todos los nombres donde aparezcan (por ejemplo
     políticas como "Providers can update…").
   - Marcá como **"a confirmar"** cualquier término donde haya más de una
     traducción razonable.

**Terminado cuando:** existen `CLAUDE.md`, `docs/` completo y el glosario. La
app no cambió. Mostrame el glosario y las dudas para que las confirme antes de
la Etapa 7.

---

## Etapa 1 — Estructura `app/` y `shared/`

Etapa 1 del refactor (ver `CLAUDE.md` y `docs/ARQUITECTURA.md`). Creá la rama
`etapa-01-estructura` desde `RefactorGeneral` actualizado.

**Objetivo:** llevar el código a la estructura objetivo moviendo archivos. Sin
cambios de comportamiento ni de nombres internos.

1. Agregá el alias `@/` → `src/` en `tsconfig.json` y en `vite.config.ts`.
2. Mové:
   - `src/components/ui/*` → `src/shared/ui/`
   - `src/lib/*` → `src/shared/lib/`
   - `src/utils/*` → `src/shared/utils/`
   - `src/types/*` → `src/shared/types/`
   - `src/app/AppController.tsx` queda en `src/app/`. `App.tsx` y `main.tsx`
     también pasan a `src/app/` si no complica el arranque de Vite; si lo
     complica, dejá `main.tsx` en `src/` y explicá por qué.
3. Actualizá todos los imports. Los que cruzan carpetas usan `@/`. Dentro de
   una misma feature, imports relativos.
4. Agregá un script `db:types` en `package.json` que regenere
   `src/shared/lib/database.types.ts` desde la base local
   (`supabase gen types typescript --local`).
5. Limpieza menor: agregá `tsconfig.tsbuildinfo` y `supabase/.branches/` al
   `.gitignore` y sacalos del repositorio con `git rm --cached`.
6. Actualizá `docs/ARQUITECTURA.md`.

**Fuera de alcance:** CSS, renombrados, cambios de lógica.

**Terminado cuando:** typecheck y build pasan, y en local funcionan el ingreso,
la selección de modalidad, entrar a un trabajo, abrir un destino, cargar una
pesada y cerrar el destino.

---

## Etapa 2 — Base de estilos y UI compartida

Etapa 2 del refactor (ver `CLAUDE.md`). Creá la rama `etapa-02-estilos-base`
desde `RefactorGeneral` actualizado.

**Objetivo:** preparar la base de CSS Modules y sacar de `App.css` los estilos
globales y los de componentes reutilizables. La app tiene que verse **igual**
que antes.

1. Creá `src/shared/styles/`:
   - `tokens.css`: variables CSS para colores (hoy hay `--color-green`,
     `--color-muted` y colores sueltos en `App.css`), espaciados, radios,
     sombras, tamaños de texto y de botones. Revisá `App.css` y reemplazá cada
     valor repetido por un token.
   - Puntos de corte: las variables CSS no funcionan dentro de `@media`, así
     que definí tres valores fijos y documentalos en un comentario de
     `tokens.css` y en `docs/ARQUITECTURA.md`: celular (base, sin media
     query), tablet desde `42rem` (el que ya se usa) y PC desde `64rem`.
   - `base.css`: el reset y los estilos de `html`, `body`, `#root`, `button`,
     `input`, `select`, `:focus-visible` y `.sr-only` (lo global de hoy).
   - Importalos una sola vez en el punto de entrada. Borrá `index.css`.
2. Creá o extraé en `src/shared/ui/`, cada uno con su `.module.css`:
   `Boton` (variantes primaria, secundaria, silenciosa; tamaños chico y
   grande; y la variante enlace que hoy es `.link-button`), `Panel`,
   `Aviso` (hoy `Feedback`, con variantes error y aviso), `Pestanas` (hoy
   `.tabs`), `EtiquetaEstado` (hoy `.status-badge`), `EstadoVacio`, `Marca`
   (hoy `Brand`) e `IndicacionInstalar` (hoy `InstallHint`). Los nombres de
   componentes y clases nuevos van en español.
3. Las variantes se eligen por props (`variante="primaria"`), no pasando
   nombres de clase desde afuera. Si hace falta combinar clases, escribí una
   función chica `unirClases` en `src/shared/utils/` en lugar de agregar una
   dependencia.
4. Reemplazá en las features los usos de esas clases globales por los
   componentes nuevos, y borrá esas reglas de `App.css`.
5. Actualizá `docs/ARQUITECTURA.md` con la lista de componentes de
   `shared/ui` y sus variantes.

**Fuera de alcance:** los estilos propios de cada feature (Etapa 3) y los
cambios de diseño para pantallas grandes (Etapa 4).

**Terminado cuando:** typecheck y build pasan, y comparando en el celular (o
vista mobile del navegador) y en escritorio, las pantallas se ven igual que en
`main`, incluidos estados deshabilitado, hover y foco.

---

## Etapa 3 — CSS Modules por feature (tres ramas)

Hacé esta etapa **tres veces**, una por feature y en este orden, cada una en
su rama y con su merge antes de la siguiente:

- 3a: `auth` → rama `etapa-03a-css-acceso`
- 3b: `groups` → rama `etapa-03b-css-trabajos`
- 3c: `loads` → rama `etapa-03c-css-cargas`

Prompt (reemplazá `<feature>` y `<rama>`):

Etapa 3 del refactor (ver `CLAUDE.md`), feature `<feature>`. Creá la rama
`<rama>` desde `RefactorGeneral` actualizado.

**Objetivo:** que cada componente de `src/features/<feature>/components/`
tenga su propio `.module.css` y que la feature no dependa más de `App.css`.
La app tiene que verse igual.

1. Por cada componente, mové sus reglas de `App.css` a
   `NombreComponente.module.css` junto al `.tsx`. Clases con nombres en
   español y cortos (`.tarjeta`, `.titulo`, `.encabezado`), porque son locales
   al componente.
2. Usá los tokens de `tokens.css` en lugar de valores sueltos.
3. Eliminá los selectores que apuntan a otro componente (por ejemplo
   `.new-destination .eyebrow` o `.work-summary .group-code`). Si un padre
   necesita cambiar algo de un hijo, el hijo recibe una prop o variante.
4. Llevá las reglas del `@media (min-width: 42rem)` del final de `App.css` al
   módulo del componente que modifican.
5. Unificá reglas duplicadas (por ejemplo `.app-header` y
   `.new-destination h2` aparecen dos veces): mirá cuál gana hoy en cascada y
   conservá ese resultado.
6. Borrá de `App.css` todo lo migrado. En la **3c**, `App.css` tiene que
   quedar vacío: borralo y sacá su import.

**Fuera de alcance:** renombrar componentes o lógica (Etapa 7) y rediseñar
para pantallas grandes (Etapa 4).

**Terminado cuando:** typecheck y build pasan, las pantallas de la feature se
ven igual en mobile y escritorio, y no queda en `App.css` ninguna regla de esa
feature.

---

## Etapa 4 — Responsive para tablet y PC

Etapa 4 del refactor (ver `CLAUDE.md` y los puntos de corte de
`docs/ARQUITECTURA.md`). Creá la rama `etapa-04-responsive` desde `RefactorGeneral`
actualizado.

**Objetivo:** que la app, pensada para celular, también sea cómoda en tablet y
PC. En celular tiene que seguir viéndose igual.

1. Revisá cada pantalla en estos anchos: 360 px, 768 px, 1024 px y 1440 px.
   Antes de cambiar nada, mostrame qué ves mal en cada ancho y qué proponés.
2. Criterios:
   - En pantallas grandes, el contenido tiene un ancho máximo legible y no se
     estira de borde a borde.
   - Los formularios no ocupan todo el ancho en PC.
   - El tablero aprovecha el espacio: por ejemplo, destinos en grilla de dos
     o tres columnas en PC y resumen de totales visible sin hacer scroll.
   - Botones y campos mantienen un área táctil de al menos 44 px en todos los
     tamaños (las tablets se usan con el dedo).
   - Sin scroll horizontal en ningún ancho.
3. Si hace falta un layout general (encabezado, contenido, pie) que cambie
   entre tamaños, ponelo en `src/shared/ui/` como componente.
4. Media queries solo con los tres puntos de corte documentados, dentro de
   cada `.module.css`.
5. Documentá en `docs/ARQUITECTURA.md` cómo se comporta cada pantalla en cada
   tamaño.

**Fuera de alcance:** la vista de tabla y la exportación (Etapa 12).

**Terminado cuando:** typecheck y build pasan, y las pantallas se ven bien en
los cuatro anchos, en vertical y horizontal en tablet, sin cambios visibles en
celular.

---

## Etapa 5 — Límites entre features con ESLint

Etapa 5 del refactor (ver `CLAUDE.md`). Creá la rama `etapa-05-limites` desde
`RefactorGeneral` actualizado.

**Objetivo:** que las reglas de importación de `docs/ARQUITECTURA.md` se
verifiquen solas.

1. Instalá ESLint con configuración plana (`eslint.config.js`),
   `typescript-eslint` y `eslint-plugin-react-hooks`. Agregá el script
   `lint` en `package.json`.
2. Con `no-restricted-imports` (y `overrides` por carpeta), hacé cumplir:
   - Desde fuera de una feature solo se importa `@/features/<feature>`
     (su `index.ts`), nunca `@/features/<feature>/algo`.
   - `src/shared/**` no importa de `@/features/**` ni de `@/app/**`.
   - `src/features/**` no importa de `@/app/**`.
   - Solo `src/features/*/model/**` y `src/shared/lib/**` importan
     `@supabase/supabase-js` o el cliente de Supabase.
3. Revisá cada `index.ts` de las features: que exporten solo lo que se usa
   desde afuera.
4. Corregí todas las infracciones que aparezcan. Si una exige mover lógica
   entre features, proponelo antes de hacerlo.
5. Agregá `npm.cmd run lint` a la lista de verificaciones de `CLAUDE.md`.

**Terminado cuando:** `lint`, typecheck y build pasan sin errores ni
excepciones desactivadas con comentarios.

---

## Etapa 6 — Tipos del dominio y mapeadores

Etapa 6 del refactor (ver `CLAUDE.md` y `docs/GLOSARIO.md`). Creá la rama
`etapa-06-dominio` desde `RefactorGeneral` actualizado.

**Objetivo:** que la capa `model/` sea la única que conoce la forma de las
filas de la base. Hacia arriba (hooks y componentes) solo circulan tipos del
dominio.

1. En cada feature, definí en `types.ts` los tipos del dominio **con nombres
   en español según el glosario** (por ejemplo `Pesada`, `Destino`, `Lote`,
   `Trabajo`), con campos en español y tipos cómodos para la UI (fechas como
   `Date` si conviene, números ya convertidos).
2. El rol en los tipos del dominio ya es `'carrero' | 'observador'`. El
   mapeador traduce desde `proveedor` y `cliente` mientras la base siga con
   esos valores (hasta la Etapa 8).
3. En `model/`, escribí funciones de mapeo (por ejemplo `aPesada(fila)`) que
   conviertan la fila de `database.types.ts` al tipo del dominio, y al revés
   para lo que se envía a la base.
4. Hacé que todas las funciones públicas de `model/` reciban y devuelvan tipos
   del dominio. Los tipos de fila no salen de `model/`.
5. Actualizá hooks y componentes para usar los tipos nuevos. Agregá una regla
   de ESLint que impida importar `database.types` fuera de `model/` y
   `shared/lib/`.
6. Documentá el patrón en `docs/ARQUITECTURA.md`.

**Fuera de alcance:** renombrar el resto del código (Etapa 7) y la base
(Etapa 8). Las columnas de la base siguen en inglés: el mapeador las traduce.

**Terminado cuando:** lint, typecheck y build pasan, y en local funcionan
todos los flujos, incluidos realtime (abrí dos ventanas con cuentas distintas)
y la bitácora de cambios.

---

## Etapa 7 — Código del frontend en español

Etapa 7 del refactor (ver `CLAUDE.md`). Creá la rama `etapa-07-codigo-es`
desde `RefactorGeneral` actualizado. **Requisito:** el glosario de `docs/GLOSARIO.md`
tiene que estar confirmado por mí (sin "a confirmar" pendientes).

**Objetivo:** que todo identificador del frontend que nombramos nosotros esté
en español, siguiendo el glosario.

1. Renombrá las carpetas de features según el glosario (por ejemplo `auth`,
   `groups`, `loads`).
2. Renombrá componentes y sus archivos (`.tsx` y `.module.css`), hooks
   (manteniendo el prefijo `use`, por ejemplo `useCargas`), funciones,
   variables, props, tipos y constantes.
3. Roles: eliminá del frontend toda mención de `proveedor` y `cliente`
   (variables, tipos, comentarios, textos). Solo quedan dentro del mapeador
   de `model/` hasta la Etapa 8.
4. Textos de la interfaz: ya están en español; no los cambies salvo que el
   glosario unifique un término.
5. **No toques** los nombres de tablas y columnas que aparecen en `model/` y
   en `database.types.ts`: siguen en inglés hasta la Etapa 8.
6. Hacé el renombrado en commits por feature para que se pueda revisar.
7. Actualizá `docs/ARQUITECTURA.md` y el glosario si algo cambió.

**Terminado cuando:** lint, typecheck y build pasan, todos los flujos funcionan
en local, y una búsqueda de los nombres en inglés del glosario y de
`proveedor`/`cliente` solo encuentra resultados en `model/` y
`database.types.ts`.

---

## Etapa 8 — Base de datos en español y roles (riesgo alto)

Etapa 8 del refactor (ver `CLAUDE.md`). Creá la rama `etapa-08-base-es` desde
`RefactorGeneral` actualizado. **No ejecutes nada contra el proyecto remoto de Supabase.**

**Objetivo:** renombrar a español tablas, columnas, funciones, triggers y
políticas de la base, y reemplazar los roles `proveedor`/`cliente` por
`carrero`/`observador`, **conservando todos los datos**, según
`docs/GLOSARIO.md`.

1. Antes de escribir nada, mostrame el plan: lista de cada objeto y su nombre
   nuevo, los valores de datos que cambian y los riesgos que veas. Esperá mi
   confirmación.
2. Escribí **migraciones nuevas** (no edites las anteriores):
   - Renombrados con `ALTER TABLE ... RENAME`, `ALTER TABLE ... RENAME
     COLUMN`, `ALTER FUNCTION ... RENAME` y equivalentes. Nunca `DROP` +
     `CREATE` de tablas con datos.
   - Roles: quitá la restricción `CHECK` de la columna de rol, actualizá los
     valores con `UPDATE` (`proveedor` → `carrero`, `cliente` →
     `observador`) y creá la restricción nueva que solo admita `carrero` y
     `observador`. Todo en la misma transacción.
   - Las políticas RLS y funciones que comparan con `'proveedor'` o
     `'cliente'` como texto se reemplazan (las políticas no guardan datos,
     así que se pueden borrar y crear de nuevo con nombre en español).
   - El historial de la bitácora (`change_audit` y sus cambios en JSON) se
     deja como está: es un registro histórico. Si te parece que conviene
     traducirlo, proponelo aparte.
3. Revisá todo lo que referencia nombres por texto y no se actualiza solo con
   el renombrado:
   - Funciones con cuerpo en SQL o PL/pgSQL (por ejemplo `record_entity_change`
     compara `tg_table_name` con `'groups'`, `'fields'`, etc.).
   - Funciones RPC llamadas desde el frontend.
   - Políticas RLS que llaman a funciones (`has_role_for_group`, etc.).
   - Restricciones `CHECK`, índices y valores por defecto.
   - La publicación de Supabase Realtime: verificá que las tablas sigan
     incluidas después del renombrado.
   - El `seed.sql`: actualizalo a los nombres y roles nuevos.
   - No toques nada del esquema `auth` de Supabase.
4. Probá en local:
   - `db:reset` (aplica todas las migraciones desde cero con el seed).
   - Además, partiendo de una base local con datos creados **antes** de la
     migración, aplicá solo las nuevas con `migration up --local` y verificá
     que los datos sigan ahí y que los roles quedaron convertidos.
   - `supabase db lint --local`.
5. Regenerá los tipos con `npm.cmd run db:types`, actualizá los mapeadores de
   `model/` y las suscripciones de Realtime a los nombres nuevos, y borrá la
   traducción de roles del mapeador. Gracias a la Etapa 6, no deberían
   cambiar otros archivos.
6. En `docs/DEPLOY.md`, escribí el procedimiento para publicar esta etapa:
   backup del proyecto remoto, `db push --dry-run`, `db push`, y deploy del
   frontend inmediatamente después (entre ambos pasos, la versión anterior de
   la app no funciona contra la base renombrada).

**Terminado cuando:** lint, typecheck y build pasan, todos los flujos funcionan
en local incluyendo realtime, bitácora y permisos de carrero y observador (con
las cuentas del seed), una búsqueda de `proveedor` y `cliente` en el repo solo
encuentra las migraciones viejas, y el procedimiento de publicación está
documentado. No hagas `db push`: lo hago yo siguiendo `docs/DEPLOY.md`.

---

## Etapa 9 — Rutas con React Router

Etapa 9 del refactor (ver `CLAUDE.md`). Creá la rama `etapa-09-rutas` desde
`RefactorGeneral` actualizado.

**Objetivo:** reemplazar la decisión de pantallas por estado de
`AppController` por rutas con URL propia.

1. Instalá `react-router` (versión 7, modo biblioteca con
   `createBrowserRouter` y `RouterProvider`).
2. Definí las rutas en `src/app/`. Cada feature exporta desde su `index.ts`
   las pantallas que la app monta. Proponé las URLs antes de implementarlas
   (por ejemplo ingreso, elegir modalidad, menú de trabajos, tablero de un
   trabajo con sus secciones Activos, Nuevo e Historial).
3. Protegé las rutas que requieren sesión y las que requieren una modalidad
   elegida, redirigiendo al paso que falta.
4. El enlace con código de invitación, si aplica, debería poder abrirse
   directo por URL.
5. Agregá `vercel.json` con una regla de reescritura de todas las rutas a
   `index.html`, para que un enlace directo o recargar la página no dé 404.
   Verificá que el service worker de la PWA también sirva `index.html` en
   las navegaciones.
6. Reducí `AppController` a lo mínimo o eliminalo si deja de tener sentido.
7. Actualizá `docs/ARQUITECTURA.md`.

**Terminado cuando:** lint, typecheck y build pasan, el botón "atrás" del
celular navega entre pantallas, recargar en cualquier URL funciona (probalo
con `npm.cmd run preview` y después en el Preview de Vercel), y los flujos
siguen funcionando.

---

## Etapa 10 — Datos con TanStack Query

Etapa 10 del refactor (ver `CLAUDE.md`). Creá la rama `etapa-10-query` desde
`RefactorGeneral` actualizado.

**Objetivo:** que la carga, caché y actualización de datos del servidor la
maneje TanStack Query en lugar de estado manual en los hooks.

1. Instalá `@tanstack/react-query` (versión 5) y montá el
   `QueryClientProvider` en `src/app/`.
2. En cada feature, definí las claves de consulta en un solo lugar (por
   ejemplo `clavesCargas` en `model/` o `hooks/`).
3. Reescribí los hooks de lectura con `useQuery` y las acciones (crear,
   editar, cerrar, eliminar) con `useMutation`, llamando siempre a las
   funciones de `model/`.
4. Supabase Realtime: mantené las suscripciones, pero cuando llega un evento
   invalidá las consultas afectadas con `queryClient.invalidateQueries` en
   lugar de modificar estado a mano. Asegurate de cerrar las suscripciones al
   salir de la pantalla.
5. Mantené los mensajes de error y de carga que hoy ve el usuario.
6. Documentá el patrón (claves, consultas, mutaciones, realtime) en
   `docs/ARQUITECTURA.md`.

**Terminado cuando:** lint, typecheck y build pasan, y en local funcionan todos
los flujos. Probá especialmente realtime con dos ventanas y cuentas distintas:
una carga una pesada y la otra la ve sin recargar.

---

## Etapa 11 — Bases del ingreso con Google

Etapa 11 del refactor (ver `CLAUDE.md` y `docs/ACCESO.md`). Creá la rama
`etapa-11-ingreso-google` desde `RefactorGeneral` actualizado. **No cambies la
configuración del proyecto remoto de Supabase ni de Google Cloud:** lo que haga
falta ahí, dejalo como lista de pasos para mí.

**Objetivo:** que el ingreso con Google quede sólido, documentado y listo para
una app publicada (también es requisito para Play Store, Etapa 13).

1. Revisá el flujo actual de ingreso (Google, enlace por correo y contraseña)
   con las rutas de la Etapa 9:
   - Después de volver de Google, el usuario cae en la pantalla que
     corresponde según su estado (sin nombre, sin modalidad, con trabajo).
   - Errores claros en español: cancelación, enlace vencido, cuenta sin
     correo confirmado, falta de conexión.
   - Probá el regreso desde Google con la PWA instalada (modo standalone) en
     Android y en iPhone, y documentá si la sesión vuelve a la app o queda en
     el navegador.
2. Agregá páginas públicas, accesibles sin sesión y con ruta propia:
   **política de privacidad** y **términos de uso**. Escribí un borrador
   simple en español (qué datos se guardan, para qué, quién los ve, cómo
   pedir la baja) y marcá con `TODO` lo que tengo que completar yo (razón
   social, contacto, jurisdicción). Las necesitan la pantalla de
   consentimiento de Google y la ficha de Play Store.
3. Actualizá `docs/ACCESO.md` con dos listas de pasos para mí:
   - **Supabase:** Site URL, Redirect URLs (dominio de producción, previews de
     Vercel y `localhost`), proveedor Google, SMTP propio, plantillas de
     correo en español.
   - **Google Cloud:** pantalla de consentimiento (nombre, logo, correo de
     soporte, dominios autorizados, enlaces a privacidad y términos), alcances
     mínimos (`openid`, `email`, `profile`), pasar la app de "prueba" a
     "producción" y qué verificación pide Google para eso.
4. Preguntame antes de cambiar estas decisiones abiertas y anotá mi respuesta
   en `docs/decisiones/`:
   - Si se mantiene el ingreso con contraseña o queda solo Google y enlace
     por correo.
   - Si el registro sigue abierto a cualquiera o se limita (por ejemplo,
     solo con código de invitación).

**Fuera de alcance:** Play Store (Etapa 13).

**Terminado cuando:** lint, typecheck y build pasan, los tres modos de ingreso
funcionan en local, las páginas legales se ven sin sesión, y `docs/ACCESO.md`
tiene las listas completas.

---

## Etapa 12 — Vista de tabla y exportación

Etapa 12 del refactor (ver `CLAUDE.md`). Creá la rama `etapa-12-exportacion`
desde `RefactorGeneral` actualizado. **No ejecutes nada contra el proyecto remoto de
Supabase.**

**Objetivo:** que toda la información cargada sea fácil de ver en una tabla en
PC y de abrir en Excel, y dejar una base de lectura estable que en el futuro
pueda alimentar monitores de una planta de silos. Corresponde a los puntos de
"vista del observador" y "exportar CSV" de `docs/HOJA-DE-RUTA.md`.

1. **Vistas SQL de lectura** (migración nueva). Antes de escribirla, mostrame
   las columnas propuestas:
   - `vista_pesadas`: una fila por pesada con trabajo, campaña, campo, lote,
     destino, tipo de destino, patente, kilos, fecha y hora, quién la cargó,
     y si el destino está abierto o cerrado.
   - `vista_destinos`: una fila por destino con totales de kilos, cantidad de
     pesadas, límite (camiones), humedad inicial, de cierre y promedio
     (silos y silobolsas), fechas de apertura y cierre.
   - Nombres de columnas en español con la unidad cuando aplica
     (`kilos`, `humedad_porcentaje`).
   - Fechas como `timestamptz`.
   - Creá las vistas con `security_invoker = true`, para que se apliquen las
     políticas RLS de quien consulta. Sin esto, una vista expone datos de
     otros grupos.
   - Por defecto, excluí lo eliminado de forma lógica. Si conviene una
     columna para verlo, proponela.
2. **Vista de tabla en PC**, en una feature nueva (por ejemplo `reportes`):
   - Tabla con filtros por trabajo, campaña, campo, lote, destino y rango de
     fechas, orden por columna y totales.
   - Disponible para carrero y observador. En celular, mostrá un aviso de que
     está pensada para pantallas grandes, o una versión resumida.
   - Lee solo de las vistas, a través de `model/` y TanStack Query.
3. **Exportación a Excel:** botón que descarga lo filtrado como CSV pensado
   para Excel en español: UTF-8 con BOM, separador `;`, coma decimal, fechas
   `dd/mm/aaaa hh:mm` en hora de Argentina. Nombre de archivo con trabajo y
   fecha. Si creés que conviene `.xlsx` en vez de CSV, explicá por qué y qué
   dependencia sumaría antes de agregarla.
4. **Contrato para integraciones futuras:** escribí
   `docs/decisiones/vistas-como-contrato.md` explicando que las vistas son la
   interfaz estable de lectura: un sistema externo (monitores de planta,
   tableros como Power BI o Grafana) las leería por la API de Supabase con un
   usuario de solo lectura, y que cambiar una columna de una vista exige
   versionarla. **No** implementes ninguna integración ni usuario de solo
   lectura ahora.
5. Marcá en `docs/HOJA-DE-RUTA.md` lo que quedó hecho.

**Terminado cuando:** lint, typecheck y build pasan, la tabla muestra solo los
datos que cada cuenta puede ver (probalo con carrero y observador de grupos
distintos), y el archivo exportado se abre bien en Excel con acentos, decimales
y fechas correctos.

---

## Etapa 13 — Preparación para Play Store

Etapa 13 del refactor (ver `CLAUDE.md`). Creá la rama `etapa-13-play-store`
desde `RefactorGeneral` actualizado.

**Objetivo:** dejar la app lista para publicarse en Play Store como PWA
empaquetada (Trusted Web Activity), y tener claro qué falta para ese hito.

1. Primero escribí `docs/PLAY-STORE.md` con un diagnóstico: qué ya cumple la
   app, qué falta en el código y qué tengo que hacer yo. Revisá en las fuentes
   oficiales de Google los requisitos vigentes (pueden haber cambiado) e
   indicá la fecha de consulta. Como mínimo cubrí:
   - Íconos PNG de 192 y 512 px y uno "maskable" (hoy solo hay SVG).
   - Manifest completo: `id`, `start_url`, `scope`, `lang` (`es-AR`),
     categorías y capturas de pantalla.
   - Digital Asset Links (`/.well-known/assetlinks.json`), que vincula el
     dominio con la app para que no aparezca la barra del navegador.
   - Dominio propio en lugar de `vercel.app` (recomendado).
   - Política de privacidad pública (Etapa 11).
   - **Eliminación de cuenta** desde la app y desde una URL web, que Play
     exige a las apps que permiten crear cuentas.
   - Formulario de "Seguridad de los datos", clasificación de contenido y
     ficha de la tienda.
   - Cuenta de desarrollador, verificación de identidad y período de pruebas
     cerradas con testers que Google pide a las cuentas personales nuevas.
   - Herramienta para generar el paquete (Bubblewrap o PWABuilder) y firma
     con Play App Signing.
   - Seguridad antes de publicar: registro abierto y el modo admin oculto
     (`debug_admin`), según `docs/SEGURIDAD.md`.

   Mostrame el diagnóstico antes de seguir.
2. Después, implementá solo lo que es código:
   - Íconos PNG y manifest completo.
   - `public/.well-known/assetlinks.json` con la huella del certificado como
     marcador que completo yo, y la configuración de Vercel para servirlo con
     `Content-Type: application/json`.
   - Una página "sin conexión" simple para cuando no hay red (no es modo
     offline: solo un aviso en lugar de una pantalla de error).
   - Eliminación de cuenta: **proponé primero** qué pasa con las pesadas que
     cargó esa persona (se conservan para el grupo, anonimizadas) y cómo se
     hace con Supabase sin exponer claves secretas en el frontend. Esperá mi
     confirmación antes de implementarla.
3. No crees cuentas, no subas nada a Play Console ni generes claves de firma:
   eso lo hago yo con los pasos de `docs/PLAY-STORE.md`.

**Terminado cuando:** lint, typecheck y build pasan, el manifest y los íconos
pasan las verificaciones de instalación de Chrome, `assetlinks.json` se sirve
en el Preview de Vercel, y `docs/PLAY-STORE.md` tiene la lista de lo que me
queda hacer a mí.
