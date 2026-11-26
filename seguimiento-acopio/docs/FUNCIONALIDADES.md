# Funcionalidades actuales

Qué hace la app hoy, en detalle. Para el resumen, ver el
[README](../README.md).

## Acceso e instalación

- Ingreso con Google, enlace por correo o correo y contraseña; recuperación de
  contraseña por correo. Detalle en [ACCESO.md](ACCESO.md).
- Instalación como PWA desde el enlace del sitio, con botón o instrucciones de
  iPhone. La app recuerda en qué pantalla, trabajo y pestaña estaba la persona
  al volver a abrirla, y el botón "atrás" del celular vuelve a la vista anterior.
- La pantalla de ingreso muestra la versión (`0.MM.DD`).

## Modalidades

- Después de entrar se elige **Carrero** u **Observador**. En modalidad
  observador no se pueden crear trabajos: se entra a trabajos existentes o se
  suma con un código de invitación.
- El admin de prueba puede cambiar entre la vista observador y carrero sin
  cerrar sesión. La autorización también se valida en Supabase.

## Trabajos, campos y lotes

- Cada trabajo tiene su campo, que se crea solo con el trabajo y lleva su
  nombre. El nombre del trabajo se muestra con el mes y año de creación.
- Los lotes los crea el usuario (el primero lo pide la app); cada lote tiene un
  cereal que se elige al crearlo y se puede corregir. Las hectáreas del lote
  las carga el observador y sirven para calcular el rendimiento.
- Los trabajos se pueden archivar si no tienen destinos activos; se recuperan
  desde la pantalla de trabajos (solo el observador ve los archivados).

## Destinos y descargas

- El carrero abre un camión, silo o silobolsa con nombre o número, carga las
  descargas en kilos y cierra el destino.
- Un mismo destino puede recibir descargas de distintos lotes; cada descarga
  guarda su lote. **No se pueden mezclar cereales en un destino**: lo controlan
  la pantalla y la base de datos.
- Un destino activo se puede fijar para que aparezca en todos los trabajos del
  carrero (por ejemplo una bolsa que se llena con lotes de dos campos); se puede
  cerrar desde cualquiera y queda registrado desde cuál se cerró.
- Las patentes se normalizan a mayúsculas, sin espacios. El formato `ABC123` o
  `AA123BB` es una sugerencia: otros formatos se aceptan tras una confirmación.
- Los camiones llevan un límite de carga. Las descargas que lo excedan se aceptan;
  la diferencia se muestra en rojo si faltan kilos y en amarillo si se supera.
- Silos y silobolsas piden humedad inicial al abrirse y de cierre al cerrarse,
  siempre con dos cifras y un decimal (12 se guarda como 12.0). Se guardan sus
  fechas y se informa el promedio.
- No se puede cerrar un destino sin descargas: la opción pasa a "eliminar".
- Cualquier destino se puede eliminar en cualquier momento. Los eliminados se
  pueden restaurar, y los cerrados se pueden reactivar (al reactivar un silo se
  pide una humedad inicial nueva y las anteriores se conservan para el promedio).

## Historial, lotes e información

- Pestañas del carrero: Activos, Nuevo e Historial. Pestañas del observador:
  Activos, Destinos, Lotes e Información.
- El historial agrupa y filtra los destinos (por nombre o patente, estado, tipo y
  lote) para que no se haga largo.
- La vista por lote muestra los kilos de cada lote con su cereal, la lista de
  descargas y el rendimiento (kg/ha y qq/ha) cuando hay hectáreas.
- Cada descarga muestra campo, lote y cereal de origen.
- Las descargas, destinos, lotes y trabajos se eliminan de forma lógica; las
  eliminaciones quedan en una bitácora visible para el grupo.

## Permisos y tiempo real

- El carrero corrige kilos y fecha de las descargas y edita destinos; el
  observador corrige quién realizó una descarga, edita destinos y reactiva los
  cerrados. RLS aplica los permisos en la base. Ver [SEGURIDAD.md](SEGURIDAD.md).
- Supabase Realtime actualiza destinos y descargas del grupo sin recargar.
- Los avisos de acción completada desaparecen a los 10 segundos.
