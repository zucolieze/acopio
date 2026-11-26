# Glosario: nombres actuales y nombres en español

Cada nombre en inglés que hoy existe en el código y en la base, con el nombre en
español propuesto. La Etapa 7 (frontend) y la Etapa 8 (base de datos) lo siguen
al pie de la letra.

Reglas (ver [ARQUITECTURA.md](ARQUITECTURA.md)):

- Sin tildes ni `ñ` en identificadores (`campania`, `anio`, `descarga`).
- Se mantienen en inglés el prefijo `use` de los hooks, las palabras clave del
  lenguaje, las APIs de React y los nombres de carpetas de capa (`components/`,
  `hooks/`, `model/`).
- Los nombres propios (Supabase, Google, Vercel) no se traducen.
- Roles: `proveedor` → `carrero` y `cliente` → `observador`.
- En la base: tablas en plural y columnas en singular, minúsculas con guion bajo.
  En el código: `PascalCase` para tipos y componentes, `camelCase` para
  funciones y variables.

## Decisiones confirmadas

Confirmadas por el responsable del proyecto:

1. **Descarga** es el término para el código, la base y la interfaz (`descargas`, `Descarga`). `pesada` deja de usarse.
2. **Bitácora**: `bitacora_cambios` en la base y `RegistroBitacora` en el código.
3. **Integrante**: `integrantes` para la tabla de la base (`members`).
4. **Miembro**: se usa `Miembro` (en lugar de `Membresia`) para lo que une a una persona con un trabajo y su rol.
5. **Campaña**: `campanias`, sin `ñ`.
6. **Fijado**: `fijado` para el destino fijado entre trabajos.
7. **Enlace de ingreso**: `enlace de ingreso` / `enlaceIngreso` para el magic link.
8. **Rol `admin`**: se conserva, solo para pruebas.
9. **Pantalla `login`**: el valor de pantalla se mantiene como `login`. La feature (carpeta) `auth` sigue llamándose `acceso`.

Pendiente de definir en su etapa:

- **Fuera del glosario:** los nombres de las clases CSS se definen en la
    Etapa 3 (son locales a cada módulo) y los de índices y restricciones de la
    base siguen la regla `<tabla>_<columna>_<tipo>` y se listan en el plan de la
    Etapa 8.

## Features (carpetas)

| Actual | Propuesto |
|---|---|
| `auth` | `acceso` |
| `groups` | `trabajos` |
| `loads` | `cargas` |

## Conceptos del dominio (tipos)

| Actual | Propuesto | Nota |
|---|---|---|
| Group | `Trabajo` | |
| Season | `Campania` | confirmado (sin `ñ`) |
| Field | `Campo` | |
| Lot | `Lote` | |
| Member | `Integrante` | confirmado |
| Membership | `Miembro` | confirmado: lo que une a una persona con un trabajo y su rol |
| WorkMember | `IntegranteDelTrabajo` | |
| Destination | `Destino` | |
| Load | `Descarga` | confirmado (también en la interfaz) |
| ChangeAudit | `RegistroBitacora` | confirmado |
| Profile | `Perfil` | |
| GroupActivity | `ActividadDelTrabajo` | |
| HumiditySession | `EtapaHumedad` | etapa anterior de un destino reactivado |
| DestinationType | `TipoDestino` | valores `camion`, `silo`, `silobolsa` (ya en español) |
| DestinationStatus | `EstadoDestino` | valores `activo`, `cerrado` (ya en español) |
| MemberRole | `RolIntegrante` | valores `carrero`, `observador`, `admin` |
| DestinationChanges | `CambiosDestino` | |
| LotChanges | `CambiosLote` | |
| WorkMode | `Modalidad` | valores `observador`, `carrero`, `admin` |
| AppScreen | `PantallaApp` | valores `login` (se mantiene), `modalidad`, `menu`, `trabajo` |
| AuthMode | `ModoAcceso` | valores `entrar`, `clave`, `crear`, `recuperar` (ya en español) |
| WorkMenuAction | `AccionMenuTrabajos` | valores `crear`, `elegir`, `sumarme` (ya en español) |
| Tab | `Pestana` | valores `activos`, `nuevo`, `historial`, `lotes`, `info` |

## Base de datos

### Tablas

| Actual | Propuesto |
|---|---|
| `profiles` | `perfiles` |
| `groups` | `trabajos` |
| `members` | `integrantes` |
| `seasons` | `campanias` |
| `fields` | `campos` |
| `lots` | `lotes` |
| `destinations` | `destinos` |
| `loads` | `descargas` |
| `change_audit` | `bitacora_cambios` |

### Columnas

| Tabla | Actual | Propuesto |
|---|---|---|
| `profiles` | `full_name` | `nombre_completo` |
| `profiles` | `updated_at` | `actualizado_en` |
| `groups` | `name` | `nombre` |
| `groups` | `invite_code` | `codigo_invitacion` |
| `groups` | `created_by` | `creado_por` |
| `groups` | `created_at` | `creado_en` |
| `groups` | `deleted_at` | `eliminado_en` |
| `groups` | `archived_at` | `archivado_en` |
| `members` | `group_id` | `trabajo_id` |
| `members` | `user_id` | `usuario_id` |
| `members` | `role` | `rol` |
| `members` | `created_at` | `creado_en` |
| `seasons` | `group_id` | `trabajo_id` |
| `seasons` | `name` | `nombre` |
| `seasons` | `year` | `anio` |
| `seasons` | `created_at` | `creado_en` |
| `fields` | `group_id` | `trabajo_id` |
| `fields` | `season_id` | `campania_id` |
| `fields` | `name` | `nombre` |
| `fields` | `created_at` | `creado_en` |
| `lots` | `field_id` | `campo_id` |
| `lots` | `name` | `nombre` |
| `lots` | `cereal` | `cereal` |
| `lots` | `hectares` | `hectareas` |
| `lots` | `created_at` | `creado_en` |
| `lots` | `deleted_at` | `eliminado_en` |
| `destinations` | `group_id` | `trabajo_id` |
| `destinations` | `lot_id` | `lote_id` |
| `destinations` | `destination_type` | `tipo` |
| `destinations` | `name` | `nombre` |
| `destinations` | `status` | `estado` |
| `destinations` | `pinned` | `fijado` |
| `destinations` | `closed_from_group_id` | `cerrado_desde_trabajo_id` |
| `destinations` | `capacity_kg` | `capacidad_kilos` |
| `destinations` | `opening_humidity` | `humedad_inicial` |
| `destinations` | `opening_humidity_at` | `humedad_inicial_en` |
| `destinations` | `closing_humidity` | `humedad_cierre` |
| `destinations` | `closing_humidity_at` | `humedad_cierre_en` |
| `destinations` | `humidity_history` | `historial_humedad` |
| `destinations` | `created_by` | `creado_por` |
| `destinations` | `created_at` | `creado_en` |
| `destinations` | `closed_at` | `cerrado_en` |
| `destinations` | `deleted_at` | `eliminado_en` |
| `loads` | `destination_id` | `destino_id` |
| `loads` | `lot_id` | `lote_id` |
| `loads` | `date` | `fecha` |
| `loads` | `kg` | `kilos` |
| `loads` | `created_by` | `creado_por` |
| `loads` | `created_at` | `creado_en` |
| `loads` | `deleted_at` | `eliminado_en` |
| `change_audit` | `group_id` | `trabajo_id` |
| `change_audit` | `destination_id` | `destino_id` |
| `change_audit` | `entity_type` | `tipo_entidad` |
| `change_audit` | `entity_id` | `entidad_id` |
| `change_audit` | `action` | `accion` |
| `change_audit` | `actor_id` | `actor_id` |
| `change_audit` | `occurred_at` | `ocurrio_en` |
| `change_audit` | `changes` | `cambios` |
| `change_audit` | `kg_delta` | `diferencia_kilos` |

`id` queda como `id` en todas las tablas. Los valores de `entity_type`
(`trabajo`, `campo`, `lote`, `destino`, `carga`) y de `action` (`editar`,
`eliminar`) y las claves `antes` y `despues` del JSON de `changes` ya están en
español y no se tocan (el valor `carga` se revisa si se confirma el punto 1 de
las dudas).

### Tipos enumerados

| Actual | Propuesto | Valores |
|---|---|---|
| `member_role` | `rol_integrante` | `proveedor` → `carrero`, `cliente` → `observador`, `admin` |
| `destination_type` | `tipo_destino` | `camion`, `silo`, `silobolsa` |
| `destination_status` | `estado_destino` | `activo`, `cerrado` |

### Funciones SQL

| Actual | Propuesto |
|---|---|
| `can_add_load` | `puede_agregar_descarga` |
| `can_view_profile` | `puede_ver_perfil` |
| `create_default_work_structure` | `crear_estructura_inicial_trabajo` |
| `create_group` | `crear_trabajo` |
| `destination_cereal_conflict` | `destino_tiene_cereal_mezclado` |
| `destination_has_my_lots` | `destino_tiene_mis_lotes` |
| `ensure_default_work_structure` | `asegurar_estructura_inicial_trabajo` |
| `handle_new_user` | `manejar_usuario_nuevo` |
| `has_role_for_destination` | `tiene_rol_para_destino` |
| `has_role_for_field` | `tiene_rol_para_campo` |
| `has_role_for_group` | `tiene_rol_para_trabajo` |
| `has_role_for_lot` | `tiene_rol_para_lote` |
| `is_debug_admin` | `es_admin_de_prueba` |
| `is_group_active` | `trabajo_esta_activo` |
| `is_group_member` | `es_integrante_del_trabajo` |
| `is_member_of_lot_group` | `es_integrante_del_trabajo_del_lote` |
| `join_group` | `unirse_a_trabajo` |
| `lot_group_id` | `trabajo_del_lote` |
| `lot_used_in_my_destinations` | `lote_usado_en_mis_destinos` |
| `prevent_deleting_lot_with_active_destinations` | `impedir_eliminar_lote_con_destinos_activos` |
| `record_entity_change` | `registrar_cambio_en_bitacora` |
| `reopen_destination` | `reactivar_destino` |
| `restore_destination` | `restaurar_destino` |
| `set_group_archived` | `archivar_trabajo` |
| `set_load_attribution` | `asignar_responsable_descarga` |
| `set_profile_updated_at` | `actualizar_fecha_perfil` |
| `validate_destination_cereal` | `validar_cereal_destino` |
| `validate_destination_details` | `validar_datos_destino` |
| `validate_load_lot` | `validar_lote_descarga` |
| `validate_lot_cereal` | `validar_cereal_lote` |
| `validate_truck_license_plate` | `validar_patente_camion` |

Los parámetros (`p_group_id`, `p_name`, `p_role`, `p_invite_code`,
`p_destination_id`, `p_opening_humidity`, `p_archived`, `p_load_id`,
`p_created_by`, `p_lot_id`, `p_extra_lot_id`) siguen el mismo patrón:
`p_trabajo_id`, `p_nombre`, `p_rol`, `p_codigo_invitacion`, `p_destino_id`,
`p_humedad_inicial`, `p_archivado`, `p_descarga_id`, `p_creado_por`, `p_lote_id`,
`p_lote_extra_id`.

### Triggers

| Actual | Propuesto |
|---|---|
| `audit_destinations_update` | `bitacora_destinos_al_actualizar` |
| `audit_fields_update` | `bitacora_campos_al_actualizar` |
| `audit_groups_update` | `bitacora_trabajos_al_actualizar` |
| `audit_loads_update` | `bitacora_descargas_al_actualizar` |
| `audit_lots_update` | `bitacora_lotes_al_actualizar` |
| `create_default_work_structure_after_group_insert` | `crear_estructura_inicial_tras_crear_trabajo` |
| `on_auth_user_created` | `al_crear_usuario` |
| `prevent_lot_deletion_with_active_destinations` | `impedir_eliminar_lote_con_destinos_activos` |
| `set_profile_updated_at` | `actualizar_fecha_perfil` |
| `validate_destination_cereal_before_update` | `validar_cereal_destino_antes_de_actualizar` |
| `validate_destination_details_before_write` | `validar_datos_destino_antes_de_guardar` |
| `validate_load_lot_before_write` | `validar_lote_descarga_antes_de_guardar` |
| `validate_lot_cereal_before_update` | `validar_cereal_lote_antes_de_actualizar` |
| `validate_truck_license_plate_before_write` | `validar_patente_camion_antes_de_guardar` |

### Políticas RLS

Los nombres están hoy en inglés (algunos con "Providers" y "Observers"). La lista
sale de las migraciones; en la Etapa 8 se verifica contra la base real.

| Tabla | Actual | Propuesto |
|---|---|---|
| `profiles` | Profiles are visible to the user and their group | El perfil lo ven la persona y su trabajo |
| `profiles` | Users can update their own profile | Cada persona edita su propio perfil |
| `groups` | Members can view their groups | Los integrantes ven sus trabajos |
| `groups` | Providers can update group work | El carrero edita el trabajo |
| `members` | Members can view their group roster | Los integrantes ven la lista del trabajo |
| `seasons` | Members can view group seasons | Los integrantes ven las campañas |
| `seasons` | Providers can create group seasons | El carrero crea campañas |
| `seasons` | Providers can update group seasons | El carrero edita campañas |
| `seasons` | Providers can delete group seasons | El carrero elimina campañas |
| `fields` | Members can view group fields | Los integrantes ven los campos |
| `fields` | Providers can create group fields | El carrero crea campos |
| `fields` | Observers can create group fields | El observador crea campos |
| `fields` | Work members can update group fields | Los integrantes editan campos |
| `fields` | Providers can delete group fields | El carrero elimina campos |
| `fields` | Members can view fields of lots loaded into their destinations | Los integrantes ven los campos de lotes cargados en sus destinos |
| `lots` | Members can view lots in their groups | Los integrantes ven los lotes del trabajo |
| `lots` | Providers can create lots in their groups | El carrero crea lotes |
| `lots` | Observers can create lots in their groups | El observador crea lotes |
| `lots` | Work members can update lots in their groups | Los integrantes editan lotes |
| `lots` | Members can view lots loaded into their destinations | Los integrantes ven los lotes cargados en sus destinos |
| `destinations` | Members can view active destinations in their groups | Los integrantes ven los destinos del trabajo |
| `destinations` | Providers can create destinations | El carrero crea destinos |
| `destinations` | Providers can update destinations | El carrero edita destinos |
| `destinations` | Observers can update destinations | El observador edita destinos |
| `destinations` | Members can view destinations holding their lots | Los integrantes ven los destinos que tienen sus lotes |
| `loads` | Members can view loads in their groups | Los integrantes ven las descargas del trabajo |
| `loads` | Providers can add loads to active destinations | El carrero agrega descargas a destinos activos |
| `loads` | Providers can update loads in their groups | El carrero edita descargas |
| `loads` | Members can view loads from their lots | Los integrantes ven las descargas de sus lotes |
| `change_audit` | Members can view work change history | Los integrantes ven la bitácora del trabajo |

## Código del frontend

### Hooks

| Actual | Propuesto |
|---|---|
| `useAuth` | `useAcceso` |
| `useGroups` | `useTrabajos` |
| `useLoads` | `useCargas` |

### Modelo (acceso a Supabase)

Archivos: `authRepository.ts` → `repositorioAcceso.ts`, `groupsRepository.ts` →
`repositorioTrabajos.ts`, `loadsRepository.ts` → `repositorioCargas.ts`.

| Actual | Propuesto |
|---|---|
| `fetchProfileName` | `obtenerNombrePerfil` |
| `saveProfileName` | `guardarNombrePerfil` |
| `signIn` | `iniciarSesion` |
| `signUp` | `crearCuenta` |
| `sendMagicLink` | `enviarEnlaceIngreso`  |
| `signInWithGoogle` | `iniciarSesionConGoogle` |
| `sendPasswordReset` | `enviarRecuperacionClave` |
| `updatePassword` | `cambiarClave` |
| `signOut` | `cerrarSesion` |
| `authErrorMessage` | `mensajeErrorAcceso` |
| `readAuthErrorFromUrl` | `leerErrorAccesoDeUrl` |
| `clearAuthErrorFromUrl` | `limpiarErrorAccesoDeUrl` |
| `fetchMemberships` | `obtenerMiembros` |
| `setGroupArchived` | `archivarTrabajo` |
| `createGroup` | `crearTrabajo` |
| `joinGroup` | `unirseATrabajo` |
| `updateGroup` | `actualizarTrabajo` |
| `softDeleteGroup` | `eliminarTrabajo` |
| `fetchGroupActivity` | `obtenerActividadDelTrabajo` |
| `createField` | `crearCampo` (hoy sin uso: candidato a borrar) |
| `updateField` | `actualizarCampo` (hoy sin uso: candidato a borrar) |
| `createLot` | `crearLote` |
| `updateLot` | `actualizarLote` |
| `updateLotDetails` | `actualizarDatosLote` |
| `softDeleteLot` | `eliminarLote` |
| `createDestination` | `crearDestino` |
| `addLoad` | `agregarDescarga` |
| `closeDestination` | `cerrarDestino` |
| `updateDestination` | `actualizarDestino` |
| `softDeleteDestination` | `eliminarDestino` |
| `updateLoad` | `actualizarDescarga` |
| `updateLoadAttribution` | `asignarResponsableDescarga` |
| `setDestinationPinned` | `fijarDestino` |
| `reopenDestination` | `reactivarDestino` |
| `restoreDestination` | `restaurarDestino` |
| `softDeleteLoad` | `eliminarDescarga` |

### Componentes

| Actual | Propuesto |
|---|---|
| `AppController` | `ControladorApp` (puede desaparecer con las rutas de la Etapa 9) |
| `AuthPage` | `PaginaAcceso` |
| `ResetPasswordPage` | `PaginaCambioClave` |
| `ProfileNamePage` | `PaginaNombrePerfil` |
| `ModeSelectionPage` | `PaginaModalidad` |
| `WorkMenuPage` | `PaginaTrabajos` |
| `DashboardPage` | `PaginaTablero` |
| `DestinationBrowser` | `BuscadorDestinos` |
| `DestinationCard` | `TarjetaDestino` |
| `DestinationHeading` | `EncabezadoDestino` |
| `DestinationManagement` | `GestionDestino` |
| `CapacitySummary` | `ResumenCapacidad` |
| `HumiditySummary` | `ResumenHumedad` |
| `NewDestinationForm` | `FormularioNuevoDestino` |
| `ReopenDestination` | `ReactivarDestino` |
| `LoadList` | `ListaDescargas` |
| `LotManagement` | `GestionLotes` |
| `LotSummary` | `ResumenLotes` |
| `WorkStructureManagement` | `GestionLotesDelCampo`  |
| `WorkSettings` | `AjustesTrabajo` |
| `AuditList` | `ListaBitacora`  |

### Componentes compartidos (`shared/ui`)

| Actual | Propuesto |
|---|---|
| `Brand` | `Marca` |
| `EmptyState` | `EstadoVacio` |
| `Feedback` | `Aviso` |
| `InstallHint` | `IndicacionInstalar` |
| (clases `.button`, `.panel`, `.tabs`, `.status-badge`) | `Boton`, `Panel`, `Pestanas`, `EtiquetaEstado` |

### Utilidades y constantes

| Actual | Propuesto |
|---|---|
| `messageFromError` | `mensajeDeError` |
| `formatKilos` | `formatearKilos` |
| `formatDate` | `formatearFecha` |
| `formatPeriod` | `formatearPeriodo` |
| `formatHumidityInput` | `formatearEntradaHumedad` |
| `parseHumidity` | `leerHumedad` |
| `humidityToInput` | `humedadAEntrada` |
| `formatHumidity` | `formatearHumedad` |
| `HUMIDITY_PATTERN` | `PATRON_HUMEDAD` |
| `HUMIDITY_ERROR` | `ERROR_HUMEDAD` |
| `normalizePlate` | `normalizarPatente` |
| `isArgentinePlate` | `esPatenteArgentina` |
| `isValidPlate` | `esPatenteValida` |
| `readStored` | `leerGuardado` |
| `writeStored` | `guardar` |
| `clearStored` | `borrarGuardados` |
| `getSupabaseClient` | `obtenerClienteSupabase` |
| `workLabel` | `etiquetaTrabajo` |
| `cerealOptions` | `opcionesCereal` |
| `destinationLabels` | `etiquetasDestino` |
| `modeLabels` | `etiquetasModalidad` |
