import { useState } from 'react'
import { Boton } from '@/shared/ui/Boton'
import { formatDate, formatKilos } from '@/shared/utils/format'
import type { Load, WorkMember } from '../types'
import { FilaAcciones } from './FilaAcciones'
import estilos from './LoadList.module.css'

type LoadListProps = {
  entries: Load[]
  profileNames: Record<string, string>
  lotNames?: Map<string, string>
  canEdit?: boolean
  canChangeAuthor?: boolean
  workMembers?: WorkMember[]
  busyId?: string
  onEdit?: (load: Load, kilos: string, date: string) => void
  onChangeAuthor?: (load: Load, userId: string | null) => void
  onDelete?: (load: Load) => void
}

export function LoadList({
  entries,
  profileNames,
  lotNames,
  canEdit = false,
  canChangeAuthor = false,
  workMembers = [],
  busyId = '',
  onEdit,
  onChangeAuthor,
  onDelete,
}: LoadListProps) {
  if (entries.length === 0) {
    return <p className={estilos.vacio}>Todavía no se cargaron descargas.</p>
  }

  return (
    <ul className={estilos.lista}>
      {entries.map((entry) => (
        <LoadRow
          key={entry.id}
          entry={entry}
          profileName={
            entry.created_by
              ? profileNames[entry.created_by] ?? 'Integrante del grupo'
              : 'Integrante del grupo'
          }
          lotName={lotNames?.get(entry.lot_id)}
          canEdit={canEdit}
          canChangeAuthor={canChangeAuthor}
          workMembers={workMembers}
          busy={busyId === entry.id}
          onEdit={onEdit}
          onChangeAuthor={onChangeAuthor}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

function LoadRow({
  entry,
  profileName,
  lotName,
  canEdit,
  canChangeAuthor,
  workMembers,
  busy,
  onEdit,
  onChangeAuthor,
  onDelete,
}: {
  entry: Load
  profileName: string
  lotName?: string
  canEdit: boolean
  canChangeAuthor: boolean
  workMembers: WorkMember[]
  busy: boolean
  onEdit?: LoadListProps['onEdit']
  onChangeAuthor?: LoadListProps['onChangeAuthor']
  onDelete?: LoadListProps['onDelete']
}) {
  const [editing, setEditing] = useState(false)
  const [changingAuthor, setChangingAuthor] = useState(false)
  const [kilos, setKilos] = useState(String(entry.kg))
  const [date, setDate] = useState(toLocalInputValue(entry.date))

  function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onEdit?.(entry, kilos, date)
    setEditing(false)
  }

  return (
    <li className={estilos.descarga}>
      <div className={estilos.detalle}>
        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
        <span>Cargó {profileName}</span>
        {lotName && <span className={estilos.lote}>Lote: {lotName}</span>}
      </div>
      <strong>{formatKilos(entry.kg)} kg</strong>
      {canChangeAuthor && !changingAuthor && (
        <Boton
          variante="enlace" className={estilos.cambiarResponsable}
          type="button"
          disabled={busy}
          onClick={() => setChangingAuthor(true)}
        >
          Cambiar responsable
        </Boton>
      )}
      {canChangeAuthor && changingAuthor && (
        <div className={estilos.responsable}>
          <button
            className={estilos.cerrarResponsable}
            type="button"
            aria-expanded="true"
            onClick={() => setChangingAuthor(false)}
          >
            Responsable de la descarga <span aria-hidden="true">▲</span>
          </button>
          <select
            aria-label="Responsable de la descarga"
            value={entry.created_by ?? ''}
            disabled={busy}
            onChange={(event) => {
              onChangeAuthor?.(entry, event.target.value || null)
              setChangingAuthor(false)
            }}
          >
            <option value="">Sin asignar</option>
            {workMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName} · {roleLabel(member.role)}
              </option>
            ))}
          </select>
        </div>
      )}
      {canEdit && (
        <FilaAcciones className={estilos.accionesDescarga}>
          <Boton
            variante="enlace"
            type="button"
            disabled={busy}
            onClick={() => {
              setKilos(String(entry.kg))
              setDate(toLocalInputValue(entry.date))
              setEditing((current) => !current)
            }}
          >
            {editing ? 'Cancelar' : 'Editar'}
          </Boton>
          <Boton
            variante="enlacePeligro"
            type="button"
            disabled={busy}
            onClick={() => onDelete?.(entry)}
          >
            Eliminar
          </Boton>
        </FilaAcciones>
      )}
      {editing && (
        <form className={estilos.edicion} onSubmit={submitEdit}>
          <label>
            Kilos
            <input
              inputMode="decimal"
              min="0.01"
              required
              step="0.01"
              type="number"
              value={kilos}
              onChange={(event) => setKilos(event.target.value)}
            />
          </label>
          <label>
            Fecha y hora
            <input
              required
              type="datetime-local"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <Boton variante="secundaria" type="submit" disabled={busy}>
            Guardar cambios
          </Boton>
        </form>
      )}
    </li>
  )
}

function roleLabel(role: WorkMember['role']) {
  if (role === 'proveedor') return 'Carrero'
  if (role === 'cliente') return 'Observador'
  return 'Admin'
}

function toLocalInputValue(value: string) {
  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}
