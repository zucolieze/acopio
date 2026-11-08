import { useState } from 'react'
import type { DestinationType } from '../../../lib/database.types'
import { Brand } from '../../../components/ui/Brand'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Feedback } from '../../../components/ui/Feedback'
import { formatKilos } from '../../../utils/format'
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
import { WorkStructureManagement } from './WorkStructureManagement'

type DashboardPageProps = {
  membership: Membership
  memberships: Membership[]
  fullName: string
  activeDestinations: Destination[]
  closedDestinations: Destination[]
  deletedDestinations: Destination[]
  loadsByDestination: Map<string, Load[]>
  fields: Field[]
  lots: Lot[]
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
  const [editingGroup, setEditingGroup] = useState(false)
  const [groupName, setGroupName] = useState(props.membership.groupName)
  const tab: Tab = props.tab === 'nuevo' && !props.isProvider ? 'activos' : props.tab
  const tabs: { id: Tab; label: string }[] = [
    { id: 'activos', label: 'Activos' },
    ...(props.isProvider ? [{ id: 'nuevo' as const, label: 'Nuevo' }] : []),
    { id: 'historial', label: 'Historial' },
  ]
  const lotNames = new Map(
    props.lots.map((lot) => [lot.id, lot.cereal ? `${lot.name} · ${lot.cereal}` : lot.name]),
  )
  const availableLots = props.lots.filter((lot) => lot.deleted_at === null)

  const lotsById = new Map(props.lots.map((lot) => [lot.id, lot]))

  // Un destino tiene un solo cereal: el del lote con el que se abrió.
  function cerealMismatch(destination: Destination) {
    const destinationCereal = lotsById.get(destination.lot_id)?.cereal ?? null
    const activeCereal = lotsById.get(props.activeLotId)?.cereal ?? null
    if (!props.activeLotId || destinationCereal === activeCereal) return ''
    return `Este destino es de ${destinationCereal ?? 'otro cereal'} y el lote elegido arriba es de ${activeCereal ?? 'otro cereal'}. No se pueden mezclar cereales: cambiá el lote arriba o usá otro destino.`
  }

  function destinationLots(destination: Destination, entries: Load[]) {
    const lotIds = [...new Set(entries.map((entry) => entry.lot_id))]
    const ids = lotIds.length > 0 ? lotIds : [destination.lot_id]
    return ids.map((id) => lotNames.get(id) ?? 'Lote no disponible').join(' / ')
  }
  // Mientras no haya ningún lote, crearlo es lo primero que se ve en "Nuevo".
  const firstLotFirst = !props.loading && !props.lots.some((lot) => lot.deleted_at === null)
  const structurePanel = props.loading ? (
    <p className="muted" role="status">Cargando lotes…</p>
  ) : (
    <WorkStructureManagement
      lots={props.lots}
      destinations={props.activeDestinations}
      activeLotId={props.activeLotId}
      newLotName={props.newLotName}
      newLotCereal={props.newLotCereal}
      busy={props.busy}
      onLotChange={props.onActiveLotChange}
      onNewLotNameChange={props.onNewLotNameChange}
      onNewLotCerealChange={props.onNewLotCerealChange}
      onCreateLot={props.onCreateLot}
      onRenameLot={props.onRenameLot}
      onUpdateLot={props.onUpdateLot}
      onDeleteLot={props.onDeleteLot}
    />
  )

  const historyDestinations = [
    ...props.activeDestinations,
    ...props.closedDestinations,
  ]
  const workAudits = props.audits.filter((entry) => entry.destination_id === null)

  function auditForDestination(destinationId: string) {
    return props.audits.filter((entry) => entry.destination_id === destinationId)
  }

  function renderHistoryDestination(destination: Destination, deleted: boolean) {
    const entries = props.loadsByDestination.get(destination.id) ?? []
    const audits = auditForDestination(destination.id)
    const expanded = !props.isProvider || props.expandedHistory === destination.id
    const total = entries.reduce((sum, entry) => sum + entry.kg, 0)
    return (
      <article className={`destination-card${deleted ? ' is-deleted' : ''}`} key={destination.id}>
        {!props.isProvider ? (
          <DestinationHeading
            destination={destination}
            entries={entries}
            closed={destination.status === 'cerrado'}
            deleted={deleted}
          />
        ) : (
        <button
          className="history-toggle"
          type="button"
          aria-expanded={expanded}
          onClick={() => props.onHistoryToggle(expanded ? null : destination.id)}
        >
          <DestinationHeading
            destination={destination}
            entries={entries}
            closed={destination.status === 'cerrado'}
            deleted={deleted}
          />
          <span className="history-toggle__icon" aria-hidden="true">
            {expanded ? '−' : '+'}
          </span>
        </button>
        )}
        {expanded && (
          <div className="destination-history">
            <p className="destination-card__lot">Lote: {destinationLots(destination, entries)}</p>
            {destination.destination_type === 'camion' ? (
              <CapacitySummary destination={destination} total={total} />
            ) : (
              <HumiditySummary destination={destination} />
            )}
            {props.isProvider && (
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
              lotNames={lotNames}
              profileNames={props.profileNames}
              canEdit={props.isProvider && !deleted}
              canChangeAuthor={!props.isProvider && !deleted}
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
            {!props.isProvider && !deleted && destination.status === 'cerrado' && (
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

  return (
    <main className="app-shell">
      <header className="app-header">
        <Brand iconOnly />
        <div className="app-header__actions">
          {props.isProvider ? (
            <label className="group-picker">
              <span className="sr-only">Lote de las descargas</span>
              <select
                aria-label="Lote de las descargas"
                value={props.activeLotId}
                disabled={availableLots.length === 0}
                onChange={(event) => props.onActiveLotChange(event.target.value)}
              >
                {availableLots.length === 0 && <option value="">Sin lotes</option>}
                {availableLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lotNames.get(lot.id)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="group-picker">
              <span className="sr-only">Trabajo</span>
              <select
                aria-label="Trabajo"
                value={props.membership.groupId}
                onChange={(event) => props.onGroupChange(event.target.value)}
              >
                {props.memberships.map((membership) => (
                  <option key={membership.groupId} value={membership.groupId}>
                    {workLabel(membership)}
                  </option>
                ))}
              </select>
            </label>
          )}
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
              lotLabel={props.activeLotId ? lotNames.get(props.activeLotId) ?? '' : ''}
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
                description={props.isProvider ? 'Tocá “Nuevo” para abrir un camión, silo o silobolsa.' : 'Cuando el proveedor abra un destino, va a aparecer acá.'}
              />
            ) : (
              props.activeDestinations.map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  location={`Lote: ${destinationLots(
                    destination,
                    props.loadsByDestination.get(destination.id) ?? [],
                  )}`}
                  loadingLot={lotNames.get(props.activeLotId) ?? ''}
                  cerealMismatch={cerealMismatch(destination)}
                  entries={props.loadsByDestination.get(destination.id) ?? []}
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
              ))
            )}
          </section>
        )}

        {tab === 'historial' && (
          <section className="destination-list" aria-live="polite">
            {historyDestinations.length === 0 ? (
              <EmptyState
                title="Todavía no hay destinos en el historial"
                description="Acá vas a ver las cargas de todos los destinos, activos y cerrados."
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

        {tab === 'historial' && (
          <>
        {!props.isProvider && (
          <details className="work-summary">
            <summary>Información del trabajo</summary>
            <div className="work-summary__content">
              <div className="summary-row">
                <div className="summary-card">
                  <span>Kilos registrados</span>
                  <strong>{formatKilos(props.totalKilos)} kg</strong>
                </div>
                <div className="summary-card">
                  <span>Destinos activos</span>
                  <strong>{props.activeDestinations.length}</strong>
                </div>
                <div className="connection-state" role="status">
                  <span className={props.live ? 'connection-state__dot is-live' : 'connection-state__dot'} />
                  {props.live ? 'En línea' : 'Conectando'}
                </div>
              </div>
              <LotSummary
                lots={props.lots}
                destinations={historyDestinations}
                loadsByDestination={props.loadsByDestination}
                canEditHectares
                busy={props.busy}
                onUpdateLot={props.onUpdateLot}
              />
              <div className="group-code">
                <span>Código para invitar</span>
                <strong>{props.membership.inviteCode}</strong>
                <button className="link-button" type="button" onClick={props.onCopyInviteCode}>
                  Copiar código
                </button>
              </div>
              {workAudits.length > 0 && (
                <AuditList entries={workAudits} profileNames={props.profileNames} lots={props.lots} />
              )}
            </div>
          </details>
        )}
        {props.isProvider && (
          <details className="work-summary">
            <summary>Opciones del trabajo</summary>
            <div className="work-summary__content">
              <div className="group-code">
                <span>Código para invitar</span>
                <strong>{props.membership.inviteCode}</strong>
                <button className="link-button" type="button" onClick={props.onCopyInviteCode}>
                  Copiar código
                </button>
              </div>
              <section className="work-management">
                <div className="destination-management__actions">
                  <button
                    className="link-button"
                    type="button"
                    onClick={() => {
                      setGroupName(props.membership.groupName)
                      setEditingGroup((current) => !current)
                    }}
                  >
                    {editingGroup ? 'Cancelar edición' : 'Editar trabajo'}
                  </button>
                  <button
                    className="link-button link-button--danger"
                    type="button"
                    disabled={props.busy === 'group'}
                    onClick={props.onDeleteGroup}
                  >
                    Eliminar trabajo
                  </button>
                </div>
                {editingGroup && (
                  <form
                    className="group-edit-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      props.onRenameGroup(groupName)
                      setEditingGroup(false)
                    }}
                  >
                    <label>
                      Nombre del trabajo
                      <input
                        maxLength={100}
                        required
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                      />
                    </label>
                    <button className="button button--secondary" type="submit" disabled={props.busy === 'group'}>
                      Guardar nombre
                    </button>
                  </form>
                )}
              </section>
            </div>
          </details>
        )}
          </>
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
