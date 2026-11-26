# Vistas SQL de lectura como contrato de datos

## Contexto

Se quiere ver los datos en una tabla en PC, exportarlos a Excel y, a futuro, alimentar monitores de una planta de silos, sin depender de las tablas internas.

## Decisión

La información se expone en vistas planas, en español y con unidades explícitas (por ejemplo `vista_descargas` y `vista_destinos`). Las vistas no cambian el modelo de datos.

## Consecuencias

- Las vistas se crean con `security_invoker = true` para respetar las políticas RLS de quien consulta.
- Cambiar una columna de una vista exige versionarla. La Etapa 12 desarrolla esta decisión.
