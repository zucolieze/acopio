import type { DestinationType } from '../../../lib/database.types'
import { Brand } from '../../../components/ui/Brand'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Feedback } from '../../../components/ui/Feedback'
import { formatDate, formatKilos } from '../../../utils/format'
import { workLabel, type Membership } from '../../groups/types'
import type {
  ChangeAudit,
  Destination,
  DestinationChanges,
  Field,
  Load,
  Lot,
  LotChanges,
  Tab,
  WorkMember,
} from '../types'
import { AuditList } from './AuditList'
import {
  CapacitySummary,
  DestinationCard,
  HumiditySummary,
} from './DestinationCard'
import { DestinationHeading } from './DestinationHeading'
import { DestinationManagement } from './DestinationManagement'
import { LoadList } from './LoadList'
import { LotSummary } from './LotSummary'
import { NewDestinationForm } from './NewDestinationForm'
import { WorkSettings } from './WorkSettings'
import { WorkStructureManagement } from './WorkStructureManagement'

type DashboardPageProps = {
  membership: Membership
  memberships: Membership[]
  /** Nombre de cada trabajo de la persona, para los destinos fijados de otros trabajos. */
  groupNames: Record<string, string>
  fullName: string
  activeDestinations: Destination[]
  closedDestinations: Destination[]
  deletedDestinations: Destination[]
  loadsByDestination: Map<string, Load[]>
  fields: Field[]
  lots: Lot[]
  lotsById: Map<string, Lot>
  fieldsById: Map<string, Field>
  workMembers: WorkMember[]
  activeLotId: string
  newLotName: string
  newLotCereal: string
  audits: ChangeAudit[]
  profileNames: Record<string, string>
  totalKilos: number
  tab: Tab
  destinationType: DestinationType
  destinationName: string
  truckCapacity: string
  openingHumidity: string
  closingHumidity: Record<string, string>
  loadKilos: Record<string, string>
  expandedHistory: string | null
  busy: string
  loading: boolean
  error: string
  notice: string
  live: boolean
  isProvider: boolean
  adminMode: 'observador' | 'carrero'
  isDebugAdmin: boolean
  onGroupChange: (groupId: string) => void
  onReturnToMenu: () => void
  onSignOut: () => void
  onAdminModeToggle: () => void
  onCopyInviteCode: () => void
  onTabChange: (tab: Tab) => void
  onActiveLotChange: (lotId: string) => void
  onNewLotNameChange: (value: string) => void
  onNewLotCerealChange: (value: string) => void
  onCreateLot: () => void
  onRenameLot: (lot: Lot, name: string) => void
  onDeleteLot: (lot: Lot) => void
  onUpdateLot: (lot: Lot, changes: LotChanges) => void
  onRenameGroup: (name: string) => void
  onArchiveGroup: () => void
  onDeleteGroup: () => void
  onDestinationTypeChange: (type: DestinationType) => void
  onDestinationNameChange: (name: string) => void
  onTruckCapacityChange: (value: string) => void
  onOpeningHumidityChange: (value: string) => void
  onCreateDestination: (
    type: DestinationType,
    name: string,
    capacity: string,
    humidity: string,
  ) => void
  onKilosChange: (destinationId: string, value: string) => void
  onClosingHumidityChange: (destinationId: string, value: string) => void
  onAddLoad: (destinationId: string, kilos: string) => void
  onCloseDestination: (destination: Destination, humidity: string) => void
  onTogglePinned: (destination: Destination, pinned: boolean) => void
  onEditLoad: (load: Load, kilos: string, date: string) => void
  onChangeLoadAuthor: (load: Load, userId: string | null) => void
  onDeleteLoad: (load: Load) => void
  onEditDestination: (destination: Destination, changes: DestinationChanges) => void
  onDeleteDestination: (destination: Destination) => void
  onRestoreDestination: (destination: Destination) => void
  onReopenDestination: (destination: Destination) => void
  onHistoryToggle: (destinationId: string | null) => void
}

export function DashboardPage(props: DashboardPageProps) {
  const groupId = props.membership.groupId
  const tabs: { id: Tab; label: string }[] = props.isProvider
    ? [
        { id: 'activos', label: 'Activos' },
        { id: 'nuevo', label: 'Nuevo' },
        { id: 'historial', label: 'Historial' },
      ]
    : [
        { id: 'activos', label: 'Activos' },
        { id: 'historial', label: 'Destinos' },
        { id: 'lotes', label: 'Lotes' },
        { id: 'info', label: 'Info' },
      ]
  const tab: Tab = tabs.some((item) => item.id === props.tab) ? props.tab : 'activos'

  const availableLots = props.lots.filter((lot) => lot.deleted_at === null)
  const fieldName = props.fields[0]?.name ?? props.membership.groupName
  const ownActiveDestinations = props.activeDestinations.filter(
    (destination) => destination.group_id === groupId,
  )
  const historyDestinations = [...props.activeDestinations, ...props.closedDestinations]
  const destinationNames = new Map(
    [...historyDestinations, ...props.deletedDestinations].map((destination) => [
      destination.id,
      destination.name,
    ]),
  )
  const workAudits = props.audits.filter((entry) => entry.destination_id === null)

  // "Lote 1 · Soja"
  function lotLabel(lotId: string) {
    const lot = props.lotsById.get(lotId)
    if (!lot) return 'Lote sin datos'
    return lot.cereal ? `${lot.name} · ${lot.cereal}` : lot.name
  }

  // "El Molino · Lote 1 · Soja": distintos campos pueden tener lotes con el mismo nombre.
  function lotWithField(lotId: string) {
    const lot = props.lotsById.get(lotId)
    if (!lot) return 'Lote sin datos'
    const field = props.fieldsById.get(lot.field_id)?.name
    return field ? `${field} · ${lotLabel(lotId)}` : lotLabel(lotId)
  }

  const lotLabels = new Map(
    [...props.lotsById.keys()].map((lotId) => [lotId, lotWithField(lotId)]),
  )

  function destinationLotIds(destination: Destination, entries: Load[]) {
    const lotIds = [...new Set(entries.map((entry) => entry.lot_id))]
    return lotIds.length > 0 ? lotIds : [destination.lot_id]
  }

  // En Activos solo se muestran lote y cereal; si hay lotes de otro campo, se aclara el campo.
  function activeLotsLabel(destination: Destination, entries: Load[]) {
    const lotIds = destinationLotIds(destination, entries)
    const mixedFields =
      new Set(lotIds.map((id) => props.lotsById.get(id)?.field_id)).size > 1 ||
      destination.group_id !== groupId
    return lotIds.map((id) => (mixedFields ? lotWithField(id) : lotLabel(id))).join(' / ')
  }

  // Un destino tiene un solo cereal: el del lote con el que se abrió.
  function cerealMismatch(destination: Destination) {
    const destinationCereal = props.lotsById.get(destination.lot_id)?.cereal ?? null
    const activeCereal = props.lotsById.get(props.activeLotId)?.cereal ?? null
    if (!props.activeLotId || destinationCereal === activeCereal) return ''
    return `Este destino es de ${destinationCereal ?? 'otro cereal'} y el lote elegido arriba es de ${activeCereal ?? 'otro cereal'}. No se pueden mezclar cereales: cambiá el lote arriba o usá otro destino.`
  }

  function originLabel(destination: Destination) {
    if (destination.group_id === groupId) return undefined
    const name = props.groupNames[destination.group_id]
    return name ? `Destino fijado desde el trabajo ${name}` : 'Destino de otro trabajo'
  }

  // Mientras no haya ningún lote, crearlo es lo primero que se ve en "Nuevo".
  const firstLotFirst = !props.loading && availableLots.length === 0
  const structurePanel = props.loading ? (
    <p className="muted" role="status">Cargando lotes…</p>
  ) : (
    <WorkStructureManagement
      lots={props.lots}
      destinations={ownActiveDestinations}
      activeLotId={props.activeLotId}
      newLotName={props.newLotName}
      newLotCereal={props.newLotCereal}
      busy={props.busy}
      onNewLotNameChange={props.onNewLotNameChange}
      onNewLotCerealChange={props.onNewLotCerealChange}
      onCreateLot={props.onCreateLot}
      onRenameLot={props.onRenameLot}
      onUpdateLot={props.onUpdateLot}
      onDeleteLot={props.onDeleteLot}
    />
  )

  function renderHistoryDestination(destination: Destination, deleted: boolean) {
    const entries = props.loadsByDestination.get(destination.id) ?? []
    const audits = props.audits.filter((entry) => entry.destination_id === destination.id)
    const expanded = !props.isProvider || props.expandedHistory === destination.id
    const total = entries.reduce((sum, entry) => sum + entry.kg, 0)
    const ownDestination = destination.group_id === groupId
    const closed = destination.status === 'cerrado'
    const heading = (
      <DestinationHeading
        destination={destination}
        entries={entries}
        closed={closed}
        deleted={deleted}
      />
    )
    return (
      <article className={`destination-card${deleted ? ' is-deleted' : ''}`} key={destination.id}>
        {props.isProvider ? (
          <button
            className="history-toggle"
            type="button"
            aria-expanded={expanded}
            onClick={() => props.onHistoryToggle(expanded ? null : destination.id)}
          >
            {heading}
            <span className="history-toggle__icon" aria-hidden="true">
              {expanded ? '−' : '+'}
            </span>
          </button>
        ) : (
          heading
        )}
        {expanded && (
          <div className="destination-history">
            <dl className="destination-facts">
              <div>
                <dt>Lotes</dt>
                <dd>
                  {destinationLotIds(destination, entries)
                    .map((id) => lotWithField(id))
                    .join(' / ')}
                </dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  {formatKilos(total)} kg en {entries.length}{' '}
                  {entries.length === 1 ? 'descarga' : 'descargas'}
                </dd>
              </div>
              <div>
                <dt>Abierto</dt>
                <dd>{formatDate(destination.created_at)}</dd>
              </div>
              {destination.closed_at && (
                <div>
                  <dt>Cerrado</dt>
                  <dd>{formatDate(destination.closed_at)}</dd>
                </div>
              )}
              {!ownDestination && (
                <div>
                  <dt>Trabajo</dt>
                  <dd>{originLabel(destination)}</dd>
                </div>
              )}
              {destination.closed_from_group_id &&
                destination.closed_from_group_id !== destination.group_id && (
                  <div>
                    <dt>Cerrado desde</dt>
                    <dd>
                      {destination.closed_from_group_id === groupId
                        ? 'Este trabajo'
                        : (props.groupNames[destination.closed_from_group_id] ?? 'Otro trabajo')}
                    </dd>
                  </div>
                )}
            </dl>
            {destination.destination_type === 'camion' ? (
              <CapacitySummary destination={destination} total={total} />
            ) : (
              <HumiditySummary destination={destination} />
            )}
            {ownDestination && !deleted && (
              <DestinationManagement
                destination={destination}
                lots={props.lots}
                busy={props.busy === destination.id}
                onSave={(changes) => props.onEditDestination(destination, changes)}
                onChangeLotCereal={(lot, cereal) => props.onUpdateLot(lot, { cereal })}
                onDelete={() => props.onDeleteDestination(destination)}
              />
            )}
            <LoadList
              entries={entries}
              lotNames={lotLabels}
              profileNames={props.profileNames}
              canEdit={props.isProvider && !deleted}
              canChangeAuthor={!props.isProvider && !deleted && ownDestination}
              workMembers={props.workMembers}
              busyId={props.busy}
              onEdit={props.onEditLoad}
              onChangeAuthor={props.onChangeLoadAuthor}
              onDelete={props.onDeleteLoad}
            />
            <AuditList
              entries={audits}
              profileNames={props.profileNames}
              lots={props.lots}
              destinationName={destination.name}
            />
            {!props.isProvider && !deleted && closed && ownDestination && (
              <button
                className="button button--secondary destination-card__reopen"
                type="button"
                disabled={props.busy === destination.id}
                onClick={() => props.onReopenDestination(destination)}
              >
                {props.busy === destination.id ? 'Reabriendo…' : 'Reabrir destino'}
              </button>
            )}
          </div>
        )}
      </article>
    )
  }

  const visibleMemberships = props.memberships.filter(
    (membership) => !membership.archived || membership.groupId === groupId,
  )

  return (
    <main className="app-shell">
      <header className="app-header">
        <Brand iconOnly />
        <div className="app-header__actions">
          <button className="button button--quiet button--small" type="button" onClick={props.onReturnToMenu}>
            Trabajos
          </button>
          {props.isDebugAdmin && props.membership.role === 'admin' && (
            <button className="button button--quiet button--small" type="button" onClick={props.onAdminModeToggle}>
              Ver como {props.adminMode === 'observador' ? 'carrero' : 'observador'}
            </button>
          )}
        </div>
      </header>

      <div className="work-context" aria-label="Campo y lote de trabajo">
        {props.isProvider ? (
          <p className="work-context__item">
            <span>Campo:</span> <strong>{fieldName}</strong>
          </p>
        ) : (
          <label className="work-context__item">
            <span>Campo:</span>
            <select
              aria-label="Campo"
              value={groupId}
              onChange={(event) => props.onGroupChange(event.target.value)}
            >
              {visibleMemberships.map((membership) => (
                <option key={membership.groupId} value={membership.groupId}>
                  {workLabel(membership)}
                </option>
              ))}
            </select>
          </label>
        )}
        {props.isProvider && (
          <label className="work-context__item">
            <span>Lote:</span>
            <select
              aria-label="Lote"
              value={props.activeLotId}
              disabled={availableLots.length === 0}
              onChange={(event) => props.onActiveLotChange(event.target.value)}
            >
              {availableLots.length === 0 && <option value="">Creá un lote en “Nuevo”</option>}
              {availableLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lotLabel(lot.id)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <section className="dashboard">
        <h1 className="sr-only">{workLabel(props.membership)}</h1>

        <Feedback error={props.error} notice={props.notice} />
        <nav className="tabs" aria-label="Secciones">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? 'tabs__button is-selected' : 'tabs__button'}
              type="button"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => props.onTabChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'nuevo' && props.isProvider && (
          <>
            {firstLotFirst && structurePanel}
            <NewDestinationForm
              destinationType={props.destinationType}
              destinationName={props.destinationName}
              truckCapacity={props.truckCapacity}
              openingHumidity={props.openingHumidity}
              busy={props.busy === 'destination'}
              loading={props.loading}
              canOpen={Boolean(props.activeLotId)}
              lotLabel={props.activeLotId ? lotLabel(props.activeLotId) : ''}
              onDestinationTypeChange={props.onDestinationTypeChange}
              onDestinationNameChange={props.onDestinationNameChange}
              onTruckCapacityChange={props.onTruckCapacityChange}
              onOpeningHumidityChange={props.onOpeningHumidityChange}
              onSubmit={props.onCreateDestination}
            />
            {!firstLotFirst && structurePanel}
          </>
        )}

        {tab === 'activos' && (
          <section className="destination-list" aria-live="polite">
            {props.activeDestinations.length === 0 ? (
              <EmptyState
                title="Todavía no hay destinos activos"
                description={props.isProvider ? 'Tocá “Nuevo” para abrir un camión, silo o silobolsa.' : 'Cuando el carrero abra un destino, va a aparecer acá.'}
              />
            ) : (
              props.activeDestinations.map((destination) => {
                const entries = props.loadsByDestination.get(destination.id) ?? []
                return (
                  <DestinationCard
                    key={destination.id}
                    destination={destination}
                    location={`Lote: ${activeLotsLabel(destination, entries)}`}
                    origin={originLabel(destination)}
                    pin={
                      props.isProvider && destination.group_id === groupId
                        ? {
                            pinned: destination.pinned,
                            onToggle: () => props.onTogglePinned(destination, !destination.pinned),
                          }
                        : undefined
                    }
                    loadingLot={props.activeLotId ? lotLabel(props.activeLotId) : ''}
                    cerealMismatch={cerealMismatch(destination)}
                    entries={entries}
                    isProvider={props.isProvider}
                    busy={props.busy === destination.id}
                    kilos={props.loadKilos[destination.id] ?? ''}
                    closingHumidity={props.closingHumidity[destination.id] ?? ''}
                    onKilosChange={(value) => props.onKilosChange(destination.id, value)}
                    onClosingHumidityChange={(value) => props.onClosingHumidityChange(destination.id, value)}
                    onAddLoad={(kilos) => props.onAddLoad(destination.id, kilos)}
                    onClose={(humidity) => props.onCloseDestination(destination, humidity)}
                    onDelete={() => props.onDeleteDestination(destination)}
                  />
                )
              })
            )}
          </section>
        )}

        {tab === 'historial' && (
          <section className="destination-list" aria-live="polite">
            {historyDestinations.length === 0 ? (
              <EmptyState
                title="Todavía no hay destinos"
                description="Acá vas a ver cada destino, activo o cerrado, con sus descargas."
              />
            ) : (
              historyDestinations.map((destination) =>
                renderHistoryDestination(destination, false),
              )
            )}
          </section>
        )}

        {tab === 'historial' && !props.isProvider && props.deletedDestinations.length > 0 && (
          <details className="deleted-destinations">
            <summary>Destinos eliminados ({props.deletedDestinations.length})</summary>
            <div className="destination-list">
              {props.deletedDestinations.map((destination) => (
                <div className="deleted-destination" key={destination.id}>
                  {renderHistoryDestination(destination, true)}
                  <button
                    className="button button--secondary"
                    type="button"
                    disabled={props.busy === destination.id}
                    onClick={() => props.onRestoreDestination(destination)}
                  >
                    {props.busy === destination.id ? 'Restaurando…' : 'Restaurar destino'}
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}

        {tab === 'historial' && props.isProvider && (
          <details className="work-summary">
            <summary>Opciones del trabajo</summary>
            <div className="work-summary__content">
              <WorkSettings
                key={groupId}
                membership={props.membership}
                busy={props.busy === 'group'}
                canEdit
                hasActiveDestinations={ownActiveDestinations.length > 0}
                onCopyInviteCode={props.onCopyInviteCode}
                onRename={props.onRenameGroup}
                onArchive={props.onArchiveGroup}
                onDelete={props.onDeleteGroup}
              />
            </div>
          </details>
        )}

        {tab === 'lotes' && !props.isProvider && (
          <div className="panel">
            <LotSummary
              lots={props.lots}
              destinations={historyDestinations}
              loadsByDestination={props.loadsByDestination}
              canEditHectares
              busy={props.busy}
              onUpdateLot={props.onUpdateLot}
              fieldName={fieldName}
              destinationNames={destinationNames}
              profileNames={props.profileNames}
            />
          </div>
        )}

        {tab === 'info' && !props.isProvider && (
          <section className="work-info panel">
            <h2>Información del trabajo</h2>
            <div className="summary-row">
              <div className="summary-card">
                <span>Kilos de este campo</span>
                <strong>{formatKilos(props.totalKilos)} kg</strong>
              </div>
              <div className="summary-card">
                <span>Destinos activos</span>
                <strong>{ownActiveDestinations.length}</strong>
              </div>
              <div className="connection-state" role="status">
                <span className={props.live ? 'connection-state__dot is-live' : 'connection-state__dot'} />
                {props.live ? 'En línea' : 'Conectando'}
              </div>
            </div>
            <WorkSettings
              key={groupId}
              membership={props.membership}
              busy={props.busy === 'group'}
              canEdit={false}
              hasActiveDestinations={ownActiveDestinations.length > 0}
              onCopyInviteCode={props.onCopyInviteCode}
              onRename={props.onRenameGroup}
              onArchive={props.onArchiveGroup}
              onDelete={props.onDeleteGroup}
            />
            {workAudits.length > 0 && (
              <AuditList entries={workAudits} profileNames={props.profileNames} lots={props.lots} />
            )}
          </section>
        )}
      </section>
      <footer className="app-footer">
        <span>
          {props.fullName
            ? `Ingresaste como ${props.fullName}.`
            : 'Seguimiento de cosecha'}
        </span>
        <button
          className="button button--quiet button--small"
          type="button"
          disabled={props.busy === 'signout'}
          onClick={props.onSignOut}
        >
          Cerrar sesión
        </button>
      </footer>
    </main>
  )
}
