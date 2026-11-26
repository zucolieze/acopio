# Sin Zod

## Contexto

La validación de datos hoy está resuelta con las restricciones de la base y validaciones simples en los formularios.

## Decisión

No se agrega Zod: la validación queda como está.

## Consecuencias

- Menos dependencias y menos cambios en este refactor.
- Si más adelante hace falta validar datos externos, se revisa esta decisión.
