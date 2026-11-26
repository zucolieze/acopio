# Monolito modular por features

## Contexto

La app creció por partes y necesita un orden que permita seguir agregando funciones sin que cada cambio toque todo. Es un proyecto chico, con una sola persona desarrollando, que debe poder usarse como base para otros proyectos parecidos.

## Decisión

Se mantiene un monolito modular organizado por features (`auth`, `groups`, `loads`, y las que vengan). No se separa en servicios ni en varias aplicaciones.

## Consecuencias

- Cada feature tiene sus componentes, hooks y acceso a datos, y solo se importa por su `index.ts`.
- Es simple de desplegar y de entender, a cambio de que los límites entre features se cuiden con reglas (ver la decisión sobre ESLint).
