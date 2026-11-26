# Acceso a la app

## Formas de entrar

- **Google:** botón "Continuar con Google".
- **Enlace por correo:** sin contraseña; la cuenta se crea sola la primera vez.
- **Correo y contraseña:** como alternativa, con recuperación de contraseña por
  correo.

Si la persona entra sin nombre (por ejemplo con el enlace por correo), la app se
lo pide una sola vez. La app se puede instalar como PWA desde el enlace del
sitio: en la pantalla de ingreso hay un botón o, en iPhone, las instrucciones
para "Agregar a pantalla de inicio". La pantalla de ingreso muestra la versión de
la app (ver [DEPLOY.md](DEPLOY.md)).

Después de entrar se elige la **modalidad** (carrero u observador). El rol no es
de la cuenta: se elige al entrar y es por trabajo. La modalidad de admin de
prueba está descripta en [SEGURIDAD.md](SEGURIDAD.md).

## Configurar el ingreso en el proyecto remoto (una sola vez)

1. **URLs**: Supabase > Authentication > URL Configuration. Poné como *Site URL*
   el dominio de Vercel y agregá en *Redirect URLs* ese dominio y
   `http://localhost:5173`. Sin esto los enlaces de correo y Google fallan.
2. **Google**: en Google Cloud Console creá un *OAuth client ID* (tipo Web) con
   la *Authorized redirect URI* que muestra Supabase en Authentication >
   Sign In / Providers > Google. Pegá Client ID y Secret ahí y activá Google.
3. **Correos**: el servicio de correo por defecto de Supabase tiene un límite
   bajo por hora y solo envía a miembros del equipo. Para uso real configurá un
   SMTP propio (Authentication > SMTP Settings). Los enlaces son de un solo uso
   y algunos antivirus de correo los "gastan" al revisarlos; si pasa, la app
   muestra "El enlace venció" y se pide otro.
4. **Plantilla**: en Authentication > Email Templates podés traducir los
   correos "Magic Link" y "Reset Password" al español.

## Estado de la configuración remota

La última vez que se revisó (noviembre de 2026): la confirmación de correo
estaba activada y el registro abierto a cualquiera; el ingreso con Google y el
SMTP propio todavía no estaban configurados. Verificalo en el panel de Supabase
antes de dar por buena esta lista.
