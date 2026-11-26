# Rutas con React Router

## Contexto

La pantalla que se muestra se decide por estado en `AppController`; no hay URL propia por pantalla, el botón "atrás" no se comporta como se espera y no se puede abrir un enlace directo.

## Decisión

Se usa React Router 7 en modo biblioteca (`createBrowserRouter` y `RouterProvider`), con rutas protegidas para sesión y modalidad.

## Consecuencias

- Hace falta `vercel.json` con reescritura a `index.html` y revisar el service worker de la PWA.
- El regreso del ingreso con Google cae en una ruta (por eso va antes que esa etapa).
