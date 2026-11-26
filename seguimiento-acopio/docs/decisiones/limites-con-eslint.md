# Límites entre features verificados con ESLint

## Contexto

Las reglas de importación entre carpetas se rompen fácilmente si solo están escritas en un documento.

## Decisión

Se verifican con ESLint (`no-restricted-imports`): una feature solo se importa por su `index.ts`, `shared/` no importa de `features/` ni de `app/`, y solo `model/` y `shared/lib/` hablan con Supabase.

## Consecuencias

- Las infracciones rompen `npm run lint`.
- Mover lógica entre features para cumplir una regla se propone antes de hacerse.
