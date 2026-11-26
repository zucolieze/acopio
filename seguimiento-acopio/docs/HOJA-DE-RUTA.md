# Hoja de ruta

El orden de las etapas del refactor está en `plan-refactor-acopio.md` (raíz del
repositorio). Acá están los objetivos de producto y lo que queda fuera de
alcance.

## Objetivo de evolución

Mantener un monolito modular y portable que pueda servir como base para forks:
dominio organizado por features, acceso a datos aislado en modelos y vistas que
no consultan Supabase directamente. Se priorizan cambios incrementales y simples
antes que una plataforma genérica.

## Próximos pasos de producto

1. **Avisos de datos pendientes:** definir qué significa "fin de jornada" y qué
   campos incompletos deben generar un aviso dentro de la aplicación.
2. **Estructura agrícola:** habilitar la selección y administración de campañas
   (hoy se crea una campaña inicial por trabajo y no hay pantallas para
   administrarlas).
3. **Datos de descarga:** variedad del cereal y otros datos acordados,
   manteniendo breve la carga del carrero. (El tipo de cereal ya está en el
   lote.)
4. **Vista del observador:** filtros por campaña, campo y lote, totales por
   destino y detalle en tiempo real, sin permisos de escritura sobre las
   descargas.
5. **Tabla y exportación a Excel (Etapa 12):** que los datos sean fáciles de ver
   en una tabla en PC y de exportar a Excel (CSV) filtrado por campaña, campo y
   lote.
6. **Monitores de planta (a futuro):** poder enviar estos datos a monitores de
   estado de una planta de silos, usando las vistas de lectura como contrato. La
   Etapa 12 deja la base; la integración queda fuera del plan actual.
7. **Responsive (Etapa 4):** que la app sea cómoda en celular, tablet y PC.
8. **Publicación en Play Store (etapas 11 y 13):** como PWA empaquetada
   (Trusted Web Activity), no como app nativa.
9. **Responsabilidades finales:** definir quién puede restaurar y reactivar
   destinos y volver a restringir los permisos (hoy son temporalmente
   abiertos; ver [SEGURIDAD.md](SEGURIDAD.md)).
10. **Validar seguridad y despliegue:** probar RLS y roles con las cuentas de
    prueba y revisar el flujo remoto antes de sumar usuarios del piloto.

## Fuera de alcance

- Mobile-first con botones grandes y formularios cortos sigue siendo la
  prioridad, para usuarios con poca experiencia tecnológica.
- No implementar por ahora modo offline, mapas o GPS, gráficos ni notificaciones
  push.
- No se agrega Zod: la validación queda como está hoy.
- No se cambia el modelo de datos con entidades nuevas (planta, organización,
  etc.) en el refactor.
- No se agregan pruebas automáticas por ahora.
