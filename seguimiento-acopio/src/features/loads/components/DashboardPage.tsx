import { useState } from 'react'
import type { DestinationType } from '../../../lib/database.types'
import { Brand } from '../../../components/ui/Brand'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Feedback } from '../../../components/ui/Feedback'
import { formatKilos } from '../../../utils/format'
import type { Membership } from '../../groups/types'
import type {
  ChangeAudit,
  Destination,
  DestinationChanges,
  Field,
  Load,
  Lot,
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
  activeFieldId: string
  activeLotId: string
  newFieldName: string
  newLotName: string
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
  onActiveFieldChange: (fieldId: string) => void
  onActiveLotChange: (lotId: string) => void
  onNewFieldNameChange: (value: string) => void
  onNewLotNameChange: (value: string) => void
  onCreateField: () => void
  onCreateLot: () => void
  onRenameField: (field: Field, name: string) => void
  onRenameLot: (lot: Lot, name: string) => void
  onDeleteLot: (lot: Lot) => void
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
  onHistoryToggle: (destinationId: string | null) => void
}

export function DashboardPage(props: DashboardPageProps) {
  const [editingGroup, setEditingGroup] = useState(false)
  const [groupName, setGroupName] = useState(props.membership.groupName)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'activos', label: 'Activos' },
    ...(props.isProvider ? [{ id: 'nuevo' as const, label: 'Nuevo' }] : []),
    { id: 'historial', label: 'Historial' },
  ]
  const lotNames = new Map(props.lots.map((lot) => [lot.id, lot.name]))
  const historyDestinations = [
    ...props.closedDestinations,
    ...props.deletedDestinations,
  ]
  const workAudits = props.audits.filter((entry) => entry.destination_id === null)

  function auditForDestination(destinationId: string) {
    return props.audits.filter((entry) => entry.destination_id === destinationId)
  }

  function renderHistoryDestination(destination: Destination, deleted: boolean) {
    const entries = props.loadsByDestination.get(destination.id) ?? []
    const audits = auditForDestination(destination.id)
    const expanded = props.expandedHistory === destination.id
    const total = entries.reduce((sum, entry) => sum + entry.kg, 0)
    const lotName = lotNames.get(destination.lot_id) ?? 'Lote no disponible'
    return (
      <article className={`destination-card${deleted ? ' is-deleted' : ''}`} key={destination.id}>
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
        {expanded && (
          <div className="destination-history">
            <p className="destination-card__lot">Lote: {lotName}</p>
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
                onDelete={() => props.onDeleteDestination(destination)}
              />
            )}
            <LoadList
              entries={entries}
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
          </div>
        )}
      </article>
    )
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <Brand />
        <div className="app-header__actions">
          <label className="group-picker">
            <span className="sr-only">Grupo de trabajo</span>
            <select
              aria-label="Grupo de trabajo"
              value={props.membership.groupId}
              onChange={(event) => props.onGroupChange(event.target.value)}
            >
              {props.memberships.map((membership) => (
                <option key={membership.groupId} value={membership.groupId}>
                  {membership.groupName}
                </option>
              ))}
            </select>
          </label>
          <button className="button button--quiet button--small" type="button" onClick={props.onReturnToMenu}>
            Trabajos
          </button>
          {props.isDebugAdmin && props.membership.role === 'admin' && (
            <button className="button button--quiet button--small" type="button" onClick={props.onAdminModeToggle}>
              Ver como {props.adminMode === 'observador' ? 'carrero' : 'observador'}
            </button>
          )}
          <button className="button button--quiet button--small" type="button" disabled={props.busy === 'signout'} onClick={props.onSignOut}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="dashboard">
        <div className="dashboard__intro">
          <div>
            <p className="eyebrow">Registro de kilos</p>
            <h1>{props.membership.groupName}</h1>
            <p className="muted">
              {props.isProvider
                ? 'Cargá las pesadas; tu equipo ve los kilos al instante.'
                : 'Seguimiento de las pesadas cargadas por tu equipo.'}
            </p>
          </div>
        </div>

        <Feedback error={props.error} notice={props.notice} />
        <nav className="tabs" aria-label="Secciones">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={props.tab === item.id ? 'tabs__button is-selected' : 'tabs__button'}
              type="button"
              aria-current={props.tab === item.id ? 'page' : undefined}
              onClick={() => props.onTabChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {props.tab === 'nuevo' && props.isProvider && (
          <NewDestinationForm
            destinationType={props.destinationType}
            destinationName={props.destinationName}
            truckCapacity={props.truckCapacity}
            openingHumidity={props.openingHumidity}
            busy={props.busy === 'destination'}
            loading={props.loading}
            canOpen={Boolean(props.activeLotId)}
            onDestinationTypeChange={props.onDestinationTypeChange}
            onDestinationNameChange={props.onDestinationNameChange}
            onTruckCapacityChange={props.onTruckCapacityChange}
            onOpeningHumidityChange={props.onOpeningHumidityChange}
            onSubmit={props.onCreateDestination}
          />
        )}

        {props.tab === 'activos' && (
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
                  lotName={lotNames.get(destination.lot_id) ?? 'Lote no disponible'}
                  lots={props.lots.filter((lot) => lot.deleted_at === null)}
                  entries={props.loadsByDestination.get(destination.id) ?? []}
                  auditEntries={auditForDestination(destination.id)}
                  workMembers={props.workMembers}
                  profileNames={props.profileNames}
                  isProvider={props.isProvider}
                  busy={props.busy === destination.id}
                  busyId={props.busy}
                  kilos={props.loadKilos[destination.id] ?? ''}
                  closingHumidity={props.closingHumidity[destination.id] ?? ''}
                  onKilosChange={(value) => props.onKilosChange(destination.id, value)}
                  onClosingHumidityChange={(value) => props.onClosingHumidityChange(destination.id, value)}
                  onAddLoad={(kilos) => props.onAddLoad(destination.id, kilos)}
                  onClose={(humidity) => props.onCloseDestination(destination, humidity)}
                  onEditLoad={props.onEditLoad}
                  onChangeLoadAuthor={props.onChangeLoadAuthor}
                  onDeleteLoad={props.onDeleteLoad}
                  onEditDestination={(changes) => props.onEditDestination(destination, changes)}
                  onDeleteDestination={() => props.onDeleteDestination(destination)}
                />
              ))
            )}
          </section>
        )}

        {props.tab === 'historial' && (
          <section className="destination-list" aria-live="polite">
            {historyDestinations.length === 0 ? (
              <EmptyState
                title="Todavía no hay destinos en el historial"
                description="Los destinos cerrados y eliminados quedan registrados acá."
              />
            ) : (
              historyDestinations.map((destination) =>
                renderHistoryDestination(destination, destination.deleted_at !== null),
              )
            )}
          </section>
        )}

        {props.loading && (
          <p className="muted" role="status">Cargando campos y lotes…</p>
        )}
        {!props.loading && (
          <WorkStructureManagement
            fields={props.fields}
            lots={props.lots}
            destinations={props.activeDestinations}
            activeFieldId={props.activeFieldId}
            activeLotId={props.activeLotId}
            newFieldName={props.newFieldName}
            newLotName={props.newLotName}
            busy={props.busy}
            hasAnyDestinations={
              props.activeDestinations.length +
                props.closedDestinations.length +
                props.deletedDestinations.length >
              0
            }
            onFieldChange={props.onActiveFieldChange}
            onLotChange={props.onActiveLotChange}
            onNewFieldNameChange={props.onNewFieldNameChange}
            onNewLotNameChange={props.onNewLotNameChange}
            onCreateField={props.onCreateField}
            onCreateLot={props.onCreateLot}
            onRenameField={props.onRenameField}
            onRenameLot={props.onRenameLot}
            onDeleteLot={props.onDeleteLot}
          />
        )}

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
            <div className="group-code">
              <span>Código para invitar</span>
              <strong>{props.membership.inviteCode}</strong>
              <button className="link-button" type="button" onClick={props.onCopyInviteCode}>
                Copiar código
              </button>
            </div>
            {props.isProvider && (
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
            )}
            {workAudits.length > 0 && (
              <details className="audit-history-details">
                <summary>Cambios en el trabajo, campos y lotes ({workAudits.length})</summary>
                <AuditList entries={workAudits} profileNames={props.profileNames} lots={props.lots} />
              </details>
            )}
          </div>
        </details>
      </section>
      <footer className="app-footer">
        {props.fullName
          ? `Ingresaste como ${props.fullName}.`
          : 'Seguimiento de cosecha'}
      </footer>
    </main>
  )
}
