# Roles `carrero` y `observador`

## Contexto

En la base y el código los roles se llaman `proveedor` y `cliente`, pero en la interfaz y en el trabajo real son carrero y observador.

## Decisión

Los únicos roles son `carrero` y `observador` en todas partes (código, base de datos, interfaz y documentación). `proveedor` y `cliente` dejan de existir.

## Consecuencias

- La Etapa 8 migra los valores en la base conservando los datos.
- El rol no pertenece a la cuenta: se elige al entrar y es por trabajo.
