import { useState, type FormEvent } from 'react'
import { Boton } from '@/shared/ui/Boton'
import { Marca } from '@/shared/ui/Marca'
import { Avisos } from '@/shared/ui/Aviso'
import { Panel } from '@/shared/ui/Panel'
import { modeLabels, type WorkMode } from '@/shared/types/app'
import type { MemberRole } from '@/shared/lib/database.types'
import { workLabel, type Membership, type WorkMenuAction } from '../types'

const roleLabels: Record<MemberRole, string> = {
  cliente: 'Observador',
  proveedor: 'Carrero',
  admin: 'Admin de prueba',
}

type WorkMenuPageProps = {
  mode: WorkMode | null
  action: WorkMenuAction
  memberships: Membership[]
  selectedGroupId: string
  groupName: string
  inviteCode: string
  busy: boolean
  error: string
  notice: string
  onActionChange: (action: WorkMenuAction) => void
  onSelectedGroupChange: (groupId: string) => void
  onGroupNameChange: (name: string) => void
  onInviteCodeChange: (code: string) => void
  onCreate: (event: FormEvent<HTMLFormElement>) => void
  onJoin: (event: FormEvent<HTMLFormElement>) => void
  onEnter: () => void
  onUnarchive: (groupId: string) => void
  onChangeMode: () => void
  onSignOut: () => void
}

export function WorkMenuPage({
  mode,
  action,
  memberships,
  selectedGroupId,
  groupName,
  inviteCode,
  busy,
  error,
  notice,
  onActionChange,
  onSelectedGroupChange,
  onGroupNameChange,
  onInviteCodeChange,
  onCreate,
  onJoin,
  onEnter,
  onUnarchive,
  onChangeMode,
  onSignOut,
}: WorkMenuPageProps) {
  const canCreateWork = mode !== 'observador'
  const activeMemberships = memberships.filter((membership) => !membership.archived)
  const archivedMemberships = memberships.filter((membership) => membership.archived)
  const [showArchived, setShowArchived] = useState(false)

  return (
    <main className="center-page center-page--top">
      <header className="simple-header">
        <Marca soloIcono />
        <div className="app-header__actions">
          <Boton variante="silenciosa" tamano="chico" type="button" onClick={onChangeMode}>
            Cambiar modalidad
          </Boton>
        </div>
      </header>
      <section className="onboarding">
        <p className="eyebrow">{mode ? modeLabels[mode] : 'Trabajo'}</p>
        <h1>¿Qué querés hacer?</h1>
        <p className="muted">
          {mode === 'observador'
            ? 'Elegí un trabajo al que ya pertenecés o sumate con un código. El carrero crea los trabajos.'
            : 'Creá un trabajo, elegí uno al que ya pertenecés o sumate con un código.'}
        </p>
        <Avisos error={error} aviso={notice} />

        <div className="work-actions">
          {canCreateWork && (
            <div className="work-action-group">
                <button
                  className={action === 'crear' ? 'work-action is-selected' : 'work-action'}
                  type="button"
                  onClick={() => onActionChange(action === 'crear' ? null : 'crear')}
                >
                  <strong>Crear un nuevo trabajo</strong>
                  <span>Empezá a registrar kilos en un trabajo nuevo.</span>
                </button>
        {action === 'crear' && canCreateWork && (
          <Panel como="form" className="form-stack work-form" onSubmit={onCreate}>
            <h2>Crear trabajo</h2>
            <label>
              Nombre del trabajo o campo
              <input
                autoComplete="organization"
                maxLength={100}
                placeholder="Ej.: El Molino"
                required
                value={groupName}
                onChange={(event) => onGroupNameChange(event.target.value)}
              />
            </label>
            <Boton variante="primaria" disabled={busy}>
              {busy ? 'Creando…' : 'Crear trabajo'}
            </Boton>
          </Panel>
        )}
            </div>
          )}
          <div className="work-action-group">
            <button
              className={action === 'elegir' ? 'work-action is-selected' : 'work-action'}
              type="button"
              disabled={memberships.length === 0}
              onClick={() => onActionChange(action === 'elegir' ? null : 'elegir')}
            >
              <strong>Entrar a un trabajo</strong>
              <span>
                {activeMemberships.length
                  ? `Elegí entre tus ${activeMemberships.length} trabajos.`
                  : 'Todavía no participás en ningún trabajo.'}
              </span>
            </button>
        {action === 'elegir' && (
          <Panel como="div" className="form-stack work-form">
            <h2>Elegir un trabajo</h2>
            <label>
              Trabajos donde ya participás
              <select value={selectedGroupId} onChange={(event) => onSelectedGroupChange(event.target.value)}>
                {activeMemberships.length === 0 && <option value="">No hay trabajos sin archivar</option>}
                {activeMemberships.map((membership) => (
                  <option key={membership.groupId} value={membership.groupId}>
                    {workLabel(membership)} · {roleLabels[membership.role]}
                  </option>
                ))}
              </select>
            </label>
            <Boton
              variante="primaria"
              disabled={!activeMemberships.some((membership) => membership.groupId === selectedGroupId)}
              onClick={onEnter}
            >
              Entrar al trabajo
            </Boton>
          </Panel>
        )}
          </div>
          {mode === 'observador' && archivedMemberships.length > 0 && (
            <div className="work-action-group">
              <button
                className={showArchived ? 'work-action is-selected' : 'work-action'}
                type="button"
                aria-expanded={showArchived}
                onClick={() => setShowArchived((current) => !current)}
              >
                <strong>Trabajos archivados</strong>
                <span>
                  {archivedMemberships.length === 1
                    ? 'Hay 1 trabajo archivado.'
                    : `Hay ${archivedMemberships.length} trabajos archivados.`}
                </span>
              </button>
              {showArchived && (
                <Panel como="div" className="form-stack work-form archived-works">
                  <h2>Reactivar un trabajo</h2>
                  <ul>
                    {archivedMemberships.map((membership) => (
                      <li key={membership.groupId}>
                        <span>{workLabel(membership)}</span>
                        <Boton
                          variante="secundaria" tamano="chico"
                          type="button"
                          disabled={busy}
                          onClick={() => onUnarchive(membership.groupId)}
                        >
                          Reactivar
                        </Boton>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>
          )}
          <div className="work-action-group">
            <button
              className={action === 'sumarme' ? 'work-action is-selected' : 'work-action'}
              type="button"
              onClick={() => onActionChange(action === 'sumarme' ? null : 'sumarme')}
            >
              <strong>Sumarme a un trabajo</strong>
              <span>Ingresá el código de invitación que te compartieron.</span>
            </button>
        {action === 'sumarme' && (
          <Panel como="form" className="form-stack work-form" onSubmit={onJoin}>
            <h2>Sumarme con un código</h2>
            <label>
              Código de invitación
              <input
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={6}
                minLength={6}
                placeholder="6 caracteres"
                required
                value={inviteCode}
                onChange={(event) => onInviteCodeChange(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6))}
              />
            </label>
            <Boton variante="secundaria" disabled={busy}>
              {busy ? 'Ingresando…' : 'Sumarme'}
            </Boton>
          </Panel>
        )}
          </div>
        </div>
      </section>
      <footer className="app-footer app-footer--end">
        <Boton
          variante="silenciosa" tamano="chico"
          type="button"
          disabled={busy}
          onClick={onSignOut}
        >
          Cerrar sesión
        </Boton>
      </footer>
    </main>
  )
}
