import type { DestinationType } from '../../../lib/database.types'
import { Brand } from '../../../components/ui/Brand'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Feedback } from '../../../components/ui/Feedback'
import { formatKilos } from '../../../utils/format'
import type { Membership } from '../../groups/types'
import type { Destination, Load, Tab } from '../types'
import { DestinationCard } from './DestinationCard'
import { DestinationHeading } from './DestinationHeading'
import { LoadList } from './LoadList'
import { NewDestinationForm } from './NewDestinationForm'

type DashboardPageProps = {
  membership: Membership
  memberships: Membership[]
  fullName: string
  activeDestinations: Destination[]
  closedDestinations: Destination[]
  loadsByDestination: Map<string, Load[]>
  profileNames: Record<string, string>
  totalKilos: number
  tab: Tab
  destinationType: DestinationType
  destinationName: string
  loadKilos: Record<string, string>
  expandedHistory: string | null
  busy: string
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
  onDestinationTypeChange: (type: DestinationType) => void
  onDestinationNameChange: (name: string) => void
  onCreateDestination: (type: DestinationType, name: string) => void
  onKilosChange: (destinationId: string, value: string) => void
  onAddLoad: (destinationId: string, kilos: string) => void
  onCloseDestination: (destination: Destination) => void
  onHistoryToggle: (destinationId: string | null) => void
}

export function DashboardPage(props: DashboardPageProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'activos', label: 'Activos' },
    ...(props.isProvider ? [{ id: 'nuevo' as const, label: 'Nuevo' }] : []),
    { id: 'historial', label: 'Historial' },
  ]

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
          </div>
        </details>

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
            busy={props.busy === 'destination'}
            onDestinationTypeChange={props.onDestinationTypeChange}
            onDestinationNameChange={props.onDestinationNameChange}
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
                  entries={props.loadsByDestination.get(destination.id) ?? []}
                  profileNames={props.profileNames}
                  isProvider={props.isProvider}
                  busy={props.busy === destination.id}
                  kilos={props.loadKilos[destination.id] ?? ''}
                  onKilosChange={(value) => props.onKilosChange(destination.id, value)}
                  onAddLoad={(kilos) => props.onAddLoad(destination.id, kilos)}
                  onClose={() => props.onCloseDestination(destination)}
                />
              ))
            )}
          </section>
        )}

        {props.tab === 'historial' && (
          <section className="destination-list" aria-live="polite">
            {props.closedDestinations.length === 0 ? (
              <EmptyState
                title="Todavía no hay destinos cerrados"
                description="Los destinos cerrados y sus kilos van a quedar guardados acá."
              />
            ) : (
              props.closedDestinations.map((destination) => {
                const entries = props.loadsByDestination.get(destination.id) ?? []
                const expanded = props.expandedHistory === destination.id
                return (
                  <article className="destination-card" key={destination.id}>
                    <button
                      className="history-toggle"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => props.onHistoryToggle(expanded ? null : destination.id)}
                    >
                      <DestinationHeading destination={destination} entries={entries} closed />
                      <span className="history-toggle__icon" aria-hidden="true">{expanded ? '−' : '+'}</span>
                    </button>
                    {expanded && <LoadList entries={entries} profileNames={props.profileNames} />}
                  </article>
                )
              })
            )}
          </section>
        )}
      </section>
      <footer className="app-footer">
        {props.fullName
          ? `Ingresaste como ${props.fullName}.`
          : 'Seguimiento de cosecha'}
      </footer>
    </main>
  )
}
