import { useState } from 'react'
import { formatDate, formatKilos } from '../../../utils/format'
import type { Load } from '../types'

type LoadListProps = {
  entries: Load[]
  profileNames: Record<string, string>
  canEdit?: boolean
  busyId?: string
  onEdit?: (load: Load, kilos: string, date: string) => void
  onDelete?: (load: Load) => void
}

export function LoadList({
  entries,
  profileNames,
  canEdit = false,
  busyId = '',
  onEdit,
  onDelete,
}: LoadListProps) {
  if (entries.length === 0) {
    return <p className="empty-loads">Todavía no se cargaron pesadas.</p>
  }

  return (
    <ul className="load-list">
      {entries.map((entry) => (
        <LoadRow
          key={entry.id}
          entry={entry}
          profileName={
            entry.created_by
              ? profileNames[entry.created_by] ?? 'Integrante del grupo'
              : 'Integrante del grupo'
          }
          canEdit={canEdit}
          busy={busyId === entry.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

function LoadRow({
  entry,
  profileName,
  canEdit,
  busy,
  onEdit,
  onDelete,
}: {
  entry: Load
  profileName: string
  canEdit: boolean
  busy: boolean
  onEdit?: LoadListProps['onEdit']
  onDelete?: LoadListProps['onDelete']
}) {
  const [editing, setEditing] = useState(false)
  const [kilos, setKilos] = useState(String(entry.kg))
  const [date, setDate] = useState(toLocalInputValue(entry.date))

  function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onEdit?.(entry, kilos, date)
    setEditing(false)
  }

  return (
    <li className="load-list__entry">
      <div className="load-list__details">
        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
        <span>Cargó {profileName}</span>
      </div>
      <strong>{formatKilos(entry.kg)} kg</strong>
      {canEdit && (
        <div className="load-list__actions">
          <button
            className="link-button"
            type="button"
            disabled={busy}
            onClick={() => {
              setKilos(String(entry.kg))
              setDate(toLocalInputValue(entry.date))
              setEditing((current) => !current)
            }}
          >
            {editing ? 'Cancelar' : 'Editar'}
          </button>
          <button
            className="link-button link-button--danger"
            type="button"
            disabled={busy}
            onClick={() => onDelete?.(entry)}
          >
            Eliminar
          </button>
        </div>
      )}
      {editing && (
        <form className="load-edit-form" onSubmit={submitEdit}>
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
          <button className="button button--secondary" type="submit" disabled={busy}>
            Guardar cambios
          </button>
        </form>
      )}
    </li>
  )
}

function toLocalInputValue(value: string) {
  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}
