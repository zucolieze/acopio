# Datos del servidor con TanStack Query

## Contexto

Cada hook carga, guarda en estado y refresca los datos a mano, y las suscripciones de Realtime modifican ese estado directamente.

## Decisión

Se usa TanStack Query: `useQuery` para leer, `useMutation` para las acciones y, cuando llega un evento de Supabase Realtime, se invalidan las consultas afectadas en lugar de tocar el estado a mano.

## Consecuencias

- Las claves de consulta se definen en un solo lugar por feature.
- Hay que cerrar las suscripciones de Realtime al salir de la pantalla.
