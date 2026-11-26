import { useState } from 'react'
import { Boton } from '@/shared/ui/Boton'
import type { Membership } from '@/features/groups/types'
import { unirClases } from '@/shared/utils/unirClases'
import { FilaAcciones } from './FilaAcciones'
import { TextoSuave } from '@/shared/ui/TextoSuave'
import estilos from './WorkSettings.module.css'

type WorkSettingsProps = {
  /** Limita el ancho del recuadro del código de invitación. */
  codigoAcotado?: boolean
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
  codigoAcotado,
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
      <div className={unirClases(estilos.codigo, codigoAcotado && estilos.codigoAcotado)}>
        <span>Código para invitar</span>
        <strong>{membership.inviteCode}</strong>
        <Boton variante="enlace" type="button" onClick={onCopyInviteCode}>
          Copiar código
        </Boton>
      </div>
      <section className={estilos.administracion}>
        <FilaAcciones>
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
        </FilaAcciones>
        {hasActiveDestinations && (
          <TextoSuave chico>
            Para archivar el trabajo primero cerrá o eliminá sus destinos activos.
          </TextoSuave>
        )}
        {editing && (
          <form
            className={estilos.edicion}
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
