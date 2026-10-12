import type { FormEvent } from 'react'
import { Brand } from '../../../components/ui/Brand'
import { Feedback } from '../../../components/ui/Feedback'
import { modeLabels, type WorkMode } from '../../../types/app'
import type { MemberRole } from '../../../lib/database.types'
import type { Membership, WorkMenuAction } from '../types'

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
  onChangeMode,
  onSignOut,
}: WorkMenuPageProps) {
  const canCreateWork = mode !== 'observador'

  return (
    <main className="center-page center-page--top">
      <header className="simple-header">
        <Brand />
        <div className="app-header__actions">
          <button className="button button--quiet button--small" type="button" onClick={onChangeMode}>
            Cambiar modalidad
          </button>
          <button className="button button--quiet button--small" type="button" disabled={busy} onClick={onSignOut}>
            Cerrar sesión
          </button>
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
        <Feedback error={error} notice={notice} />

        <div className="work-actions">
          {canCreateWork && (
            <button
              className={action === 'crear' ? 'work-action is-selected' : 'work-action'}
              type="button"
              onClick={() => onActionChange(action === 'crear' ? null : 'crear')}
            >
              <strong>Crear un nuevo trabajo</strong>
              <span>Empezá a registrar kilos en un trabajo nuevo.</span>
            </button>
          )}
          <button
            className={action === 'elegir' ? 'work-action is-selected' : 'work-action'}
            type="button"
            disabled={memberships.length === 0}
            onClick={() => onActionChange(action === 'elegir' ? null : 'elegir')}
          >
            <strong>Entrar a un trabajo</strong>
            <span>
              {memberships.length
                ? `Elegí entre tus ${memberships.length} trabajos.`
                : 'Todavía no participás en ningún trabajo.'}
            </span>
          </button>
          <button
            className={action === 'sumarme' ? 'work-action is-selected' : 'work-action'}
            type="button"
            onClick={() => onActionChange(action === 'sumarme' ? null : 'sumarme')}
          >
            <strong>Sumarme a un trabajo</strong>
            <span>Ingresá el código de invitación que te compartieron.</span>
          </button>
        </div>

        {action === 'crear' && canCreateWork && (
          <form className="panel form-stack work-form" onSubmit={onCreate}>
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
            <button className="button button--primary" disabled={busy}>
              {busy ? 'Creando…' : 'Crear trabajo'}
            </button>
          </form>
        )}

        {action === 'elegir' && (
          <div className="panel form-stack work-form">
            <h2>Elegir un trabajo</h2>
            <label>
              Trabajos donde ya participás
              <select value={selectedGroupId} onChange={(event) => onSelectedGroupChange(event.target.value)}>
                {memberships.map((membership) => (
                  <option key={membership.groupId} value={membership.groupId}>
                    {membership.groupName} · {roleLabels[membership.role]}
                  </option>
                ))}
              </select>
            </label>
            <button className="button button--primary" disabled={!selectedGroupId} onClick={onEnter}>
              Entrar al trabajo
            </button>
          </div>
        )}

        {action === 'sumarme' && (
          <form className="panel form-stack work-form" onSubmit={onJoin}>
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
            <button className="button button--secondary" disabled={busy}>
              {busy ? 'Ingresando…' : 'Sumarme'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
