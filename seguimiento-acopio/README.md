# Acopio

App mobile-first para registrar las descargas de cereal en camiones, silos y
silobolsas y compartir los kilos acumulados con el grupo de trabajo. Pensada
para personas con poca experiencia tecnológica: botones grandes, pocos pasos y
mensajes claros.

- Aplicación publicada: <https://acopio-five.vercel.app/>
- Repositorio: <https://github.com/zucolieze/acopio> (público)
- Carpeta de la app: `seguimiento-acopio/`

## Estado actual

Funciona el circuito completo **trabajo → lotes → destinos → descargas →
cierre → historial**, con dos modalidades:

- **Carrero:** abre destinos, carga las descargas, cierra, edita y elimina.
- **Observador:** ve en tiempo real los kilos por destino y por lote, corrige
  datos, reactiva destinos cerrados y consulta la información del campo.

Otras cosas que ya están: ingreso con Google, enlace por correo o contraseña;
instalación como PWA; actualización en tiempo real; bitácora de eliminaciones;
destinos fijados entre trabajos; control para no mezclar cereales en un mismo
destino. El detalle está en [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md).

Stack: React, TypeScript, Vite, PWA, Supabase (Postgres, Auth, Realtime, RLS) y
Vercel.

## Documentación

| Documento | Contenido |
|---|---|
| [docs/DESARROLLO.md](docs/DESARROLLO.md) | Requisitos, desarrollo local, Supabase local, migraciones |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Vercel, Supabase remoto, variables, ramas y previews |
| [docs/SEGURIDAD.md](docs/SEGURIDAD.md) | Credenciales, RLS, cuentas de prueba, admin de prueba, datos de prueba |
| [docs/ACCESO.md](docs/ACCESO.md) | Cómo se entra a la app y configuración de Supabase y Google |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Carpetas, capas, reglas de importación, idioma |
| [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md) | Qué hace la app hoy, en detalle |
| [docs/HOJA-DE-RUTA.md](docs/HOJA-DE-RUTA.md) | Próximos pasos y fuera de alcance |
| [docs/GLOSARIO.md](docs/GLOSARIO.md) | Nombres actuales en inglés y su nombre propuesto en español |
| [docs/decisiones/](docs/decisiones/) | Una decisión por archivo |

Las reglas de trabajo del proyecto están en [`../CLAUDE.md`](../CLAUDE.md).
