# Responsive: celular, tablet y PC

## Contexto

La app nació pensada para el celular, pero el observador y la exportación de datos se usan en pantallas grandes, y las tablets se usan con el dedo.

## Decisión

Mobile-first, y también usable en tablet y PC. Hay tres tamaños: celular (base, sin media query), tablet desde `42rem` y PC desde `64rem`. Las media queries van dentro de cada módulo de CSS.

## Consecuencias

- Las variables CSS no funcionan dentro de `@media`, por eso los puntos de corte son valores fijos y documentados.
- Botones y campos mantienen un área táctil de al menos 44 px.
