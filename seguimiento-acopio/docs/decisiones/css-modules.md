# Estilos con CSS Modules

## Contexto

Todos los estilos están en `App.css` e `index.css`, con selectores globales y reglas que apuntan a clases de otros componentes. Eso hace difícil cambiar un componente sin romper otro.

## Decisión

Se usan CSS Modules, un `.module.css` junto a cada componente, con los tokens (colores, espaciados, radios, sombras, tamaños) en variables CSS dentro de `src/shared/styles/tokens.css`. Se elimina `App.css`.

## Consecuencias

- Cada componente es dueño de sus estilos.
- No se permiten selectores que apunten a clases de otro componente: un padre que necesita cambiar a un hijo le pasa una prop o variante.
