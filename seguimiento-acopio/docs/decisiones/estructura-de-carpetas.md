# Estructura de carpetas objetivo

## Contexto

Hoy lo compartido está repartido en `src/components/ui/`, `src/lib/`, `src/utils/` y `src/types/`, y no hay una carpeta clara para el arranque de la app.

## Decisión

La estructura objetivo es `src/app/` (arranque, rutas, providers, layout), `src/shared/` (UI, lib, utils, estilos, tipos comunes) y `src/features/<feature>/` con `components/`, `hooks/`, `model/` e `index.ts`.

## Consecuencias

- Etapa 1 mueve los archivos sin cambiar comportamiento.
- Los imports que cruzan carpetas usan el alias `@/`.
