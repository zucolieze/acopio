# Tipos del dominio en `model/`

## Contexto

Hoy las filas de la base (`database.types.ts`) circulan por hooks y componentes, así que cualquier cambio en la base se propaga a toda la interfaz.

## Decisión

La capa `model/` devuelve tipos del dominio, no filas de la base: funciones de mapeo convierten fila ↔ dominio. Una regla de ESLint impide importar `database.types` fuera de `model/` y `shared/lib/`.

## Consecuencias

- Renombrar la base (Etapa 8) toca pocos archivos.
- Los tipos del dominio ya usan los nombres en español y los roles `carrero` y `observador`; el mapeador traduce mientras la base siga con otros valores.
