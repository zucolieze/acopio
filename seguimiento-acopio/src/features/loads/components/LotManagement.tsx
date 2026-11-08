import { useState } from 'react'
import type { FormEvent } from 'react'
import { cerealOptions } from '../types'
import type { Destination, Lot, LotChanges } from '../types'

type LotManagementProps = {
  lots: Lot[]
  destinations: Destination[]
  busy: string
  onRename: (lot: Lot, name: string) => void
  onUpdate: (lot: Lot, changes: LotChanges) => void
  onDelete: (lot: Lot) => void
}

export function LotManagement({
  lots,
  destinations,
  busy,
  onRename,
  onUpdate,
  onDelete,
}: LotManagementProps) {
  if (lots.length === 0) return null

  return (
    <details className="lot-management">
      <summary>Administrar lotes</summary>
      <ul>
        {lots.map((lot) => (
          <LotRow
            key={lot.id}
            lot={lot}
            hasActiveDestinations={destinations.some(
              (destination) =>
                destination.lot_id === lot.id &&
                destination.status === 'activo' &&
                destination.deleted_at === null,
            )}
            isLastActiveLot={lots.length === 1}
            busy={busy === lot.id}
            onRename={onRename}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </details>
  )
}

function LotRow({
  lot,
  hasActiveDestinations,
  isLastActiveLot,
  busy,
  onRename,
  onUpdate,
  onDelete,
}: {
  lot: Lot
  hasActiveDestinations: boolean
  isLastActiveLot: boolean
  busy: boolean
  onRename: LotManagementProps['onRename']
  onUpdate: LotManagementProps['onUpdate']
  onDelete: LotManagementProps['onDelete']
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(lot.name)
  const [cereal, setCereal] = useState(lot.cereal ?? '')
  const [hectares, setHectares] = useState(lot.hectares === null ? '' : String(lot.hectares))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim() !== lot.name) onRename(lot, name)
    const nextHectares = hectares.trim() ? Number(hectares.replace(',', '.')) : null
    onUpdate(lot, { cereal: cereal || undefined, hectares: nextHectares })
    setEditing(false)
  }

  return (
    <li>
      {editing ? (
        <form className="lot-management__edit" onSubmit={submit}>
          <input
            maxLength={120}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label={`Nombre del lote ${lot.name}`}
          />
          <select
            value={cereal}
            aria-label="Cereal del lote"
            onChange={(event) => setCereal(event.target.value)}
          >
            {!lot.cereal && <option value="">Sin cereal</option>}
            {cerealOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input
            inputMode="decimal"
            min="0.01"
            placeholder="Hectáreas"
            step="0.01"
            type="number"
            value={hectares}
            aria-label="Hectáreas del lote"
            onChange={(event) => setHectares(event.target.value)}
          />
          <button className="button button--secondary button--small" type="submit" disabled={busy}>
            Guardar
          </button>
        </form>
      ) : (
        <>
          <span>
            {lot.name}
            {lot.cereal ? ` · ${lot.cereal}` : ''}
            {lot.hectares ? ` · ${lot.hectares} ha` : ''}
          </span>
          <div className="lot-management__actions">
            <button
              className="link-button"
              type="button"
              disabled={busy}
              onClick={() => {
                setName(lot.name)
                setCereal(lot.cereal ?? '')
                setHectares(lot.hectares === null ? '' : String(lot.hectares))
                setEditing(true)
              }}
            >
              Editar
            </button>
            <button
              className="link-button link-button--danger"
              type="button"
              disabled={busy || hasActiveDestinations || isLastActiveLot}
              title={
                hasActiveDestinations
                  ? 'Cerrá o eliminá los destinos activos antes de eliminar el lote.'
                  : isLastActiveLot
                    ? 'El trabajo debe conservar al menos un lote activo.'
                  : undefined
              }
              onClick={() => onDelete(lot)}
            >
              Eliminar
            </button>
          </div>
        </>
      )}
      {hasActiveDestinations && (
        <p className="muted small-copy">Tiene destinos activos; no se puede eliminar todavía.</p>
      )}
      {isLastActiveLot && (
        <p className="muted small-copy">El trabajo debe conservar al menos un lote activo.</p>
      )}
    </li>
  )
}
