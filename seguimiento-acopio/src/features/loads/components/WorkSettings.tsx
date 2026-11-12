import { useState } from 'react'
import type { Membership } from '../../groups/types'

type WorkSettingsProps = {
  membership: Membership
  busy: boolean
  canEdit: boolean
  hasActiveDestinations: boolean
  onCopyInviteCode: () => void
  onRename: (name: string) => void
  onArchive: () => void
  onDelete: () => void
}

// Código de invitación y acciones sobre el trabajo (editar, archivar, eliminar).
export function WorkSettings({
  membership,
  busy,
  canEdit,
  hasActiveDestinations,
  onCopyInviteCode,
  onRename,
  onArchive,
  onDelete,
}: WorkSettingsProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(membership.groupName)

  return (
    <>
      <div className="group-code">
        <span>Código para invitar</span>
        <strong>{membership.inviteCode}</strong>
        <button className="link-button" type="button" onClick={onCopyInviteCode}>
          Copiar código
        </button>
      </div>
      <section className="work-management">
        <div className="destination-management__actions">
          {canEdit && (
            <button
              className="link-button"
              type="button"
              onClick={() => {
                setName(membership.groupName)
                setEditing((current) => !current)
              }}
            >
              {editing ? 'Cancelar edición' : 'Editar trabajo'}
            </button>
          )}
          <button
            className="link-button"
            type="button"
            disabled={busy || hasActiveDestinations}
            onClick={onArchive}
          >
            Archivar trabajo
          </button>
          {canEdit && (
            <button
              className="link-button link-button--danger"
              type="button"
              disabled={busy}
              onClick={onDelete}
            >
              Eliminar trabajo
            </button>
          )}
        </div>
        {hasActiveDestinations && (
          <p className="muted small-copy">
            Para archivar el trabajo primero cerrá o eliminá sus destinos activos.
          </p>
        )}
        {editing && (
          <form
            className="group-edit-form"
            onSubmit={(event) => {
              event.preventDefault()
              onRename(name)
              setEditing(false)
            }}
          >
            <label>
              Nombre del trabajo
              <input
                maxLength={100}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <button className="button button--secondary" type="submit" disabled={busy}>
              Guardar nombre
            </button>
          </form>
        )}
      </section>
    </>
  )
}
