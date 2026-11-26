import { useState } from 'react'
import { Boton } from '@/shared/ui/Boton'
import type { Membership } from '@/features/groups/types'

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
        <Boton variante="enlace" type="button" onClick={onCopyInviteCode}>
          Copiar código
        </Boton>
      </div>
      <section className="work-management">
        <div className="destination-management__actions">
          {canEdit && (
            <Boton
              variante="enlace"
              type="button"
              onClick={() => {
                setName(membership.groupName)
                setEditing((current) => !current)
              }}
            >
              {editing ? 'Cancelar edición' : 'Editar trabajo'}
            </Boton>
          )}
          <Boton
            variante="enlace"
            type="button"
            disabled={busy || hasActiveDestinations}
            onClick={onArchive}
          >
            Archivar trabajo
          </Boton>
          {canEdit && (
            <Boton
              variante="enlacePeligro"
              type="button"
              disabled={busy}
              onClick={onDelete}
            >
              Eliminar trabajo
            </Boton>
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
            <Boton variante="secundaria" type="submit" disabled={busy}>
              Guardar nombre
            </Boton>
          </form>
        )}
      </section>
    </>
  )
}
