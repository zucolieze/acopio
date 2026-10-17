import { useState } from 'react'
import type { FormEvent } from 'react'
import type { DestinationChanges, Destination, Lot } from '../types'
import type { DestinationType } from '../../../lib/database.types'
import { destinationLabels } from '../types'

type DestinationManagementProps = {
  destination: Destination
  lots: Lot[]
  busy: boolean
  onSave: (changes: DestinationChanges) => void
  onDelete: () => void
}

export function DestinationManagement({
  destination,
  lots,
  busy,
  onSave,
  onDelete,
}: DestinationManagementProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(destination.name)
  const [lotId, setLotId] = useState(destination.lot_id)
  const [type, setType] = useState<DestinationType>(destination.destination_type)
  const [capacity, setCapacity] = useState(
    destination.capacity_kg === null ? '' : String(destination.capacity_kg),
  )
  const [openingHumidity, setOpeningHumidity] = useState(
    destination.opening_humidity === null ? '' : String(destination.opening_humidity),
  )
  const [openingAt, setOpeningAt] = useState(
    destination.opening_humidity_at ? toLocalInputValue(destination.opening_humidity_at) : '',
  )
  const [closingHumidity, setClosingHumidity] = useState(
    destination.closing_humidity === null ? '' : String(destination.closing_humidity),
  )
  const [closingAt, setClosingAt] = useState(
    destination.closing_humidity_at ? toLocalInputValue(destination.closing_humidity_at) : '',
  )
  const [closedAt, setClosedAt] = useState(
    destination.closed_at ? toLocalInputValue(destination.closed_at) : '',
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const changes: DestinationChanges = {
      lot_id: lotId,
      destination_type: type,
      name: name.trim(),
      capacity_kg: type === 'camion' ? parseOptionalNumber(capacity) : null,
      opening_humidity:
        type === 'camion' ? null : parseOptionalNumber(openingHumidity),
      opening_humidity_at:
        type === 'camion' || !openingAt ? null : new Date(openingAt).toISOString(),
      closing_humidity:
        type === 'camion' ? null : parseOptionalNumber(closingHumidity),
      closing_humidity_at:
        type === 'camion' || !closingAt ? null : new Date(closingAt).toISOString(),
      closed_at: closedAt ? new Date(closedAt).toISOString() : null,
    }
    onSave(changes)
    setEditing(false)
  }

  return (
    <div className="destination-management">
      <div className="destination-management__actions">
        <button
          className="link-button"
          type="button"
          onClick={() => setEditing((current) => !current)}
          disabled={busy}
        >
          {editing ? 'Cancelar edición' : 'Editar destino'}
        </button>
        <button
          className="link-button link-button--danger"
          type="button"
          onClick={onDelete}
          disabled={busy || destination.deleted_at !== null}
        >
          Eliminar destino
        </button>
      </div>
      {editing && (
        <form className="destination-edit-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              maxLength={120}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Lote
            <select required value={lotId} onChange={(event) => setLotId(event.target.value)}>
              {lots.map((lot) => (
                <option
                  key={lot.id}
                  value={lot.id}
                  disabled={lot.deleted_at !== null && lot.id !== destination.lot_id}
                >
                  {lot.name}{lot.deleted_at ? ' (eliminado)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo de destino
            <select
              value={type}
              onChange={(event) => setType(event.target.value as DestinationType)}
            >
              {(Object.keys(destinationLabels) as DestinationType[]).map((value) => (
                <option key={value} value={value}>{destinationLabels[value]}</option>
              ))}
            </select>
          </label>
          {type === 'camion' ? (
            <label>
              Límite de carga (kg)
              <input
                inputMode="decimal"
                min="0.01"
                required
                step="0.01"
                type="number"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
              />
            </label>
          ) : (
            <>
              <label>
                Humedad inicial (%)
                <input
                  inputMode="decimal"
                  max="100"
                  min="0"
                  required
                  step="0.01"
                  type="number"
                  value={openingHumidity}
                  onChange={(event) => setOpeningHumidity(event.target.value)}
                />
              </label>
              <label>
                Fecha y hora de humedad inicial
                <input
                  required
                  type="datetime-local"
                  value={openingAt}
                  onChange={(event) => setOpeningAt(event.target.value)}
                />
              </label>
              {destination.status === 'cerrado' && (
                <>
                  <label>
                    Humedad de cierre (%)
                    <input
                      inputMode="decimal"
                      max="100"
                      min="0"
                      required
                      step="0.01"
                      type="number"
                      value={closingHumidity}
                      onChange={(event) => setClosingHumidity(event.target.value)}
                    />
                  </label>
                  <label>
                    Fecha y hora de humedad de cierre
                    <input
                      required
                      type="datetime-local"
                      value={closingAt}
                      onChange={(event) => setClosingAt(event.target.value)}
                    />
                  </label>
                </>
              )}
            </>
          )}
          {destination.status === 'cerrado' && (
            <label>
              Fecha y hora de cierre
              <input
                required
                type="datetime-local"
                value={closedAt}
                onChange={(event) => setClosedAt(event.target.value)}
              />
            </label>
          )}
          <button className="button button--secondary" type="submit" disabled={busy}>
            Guardar cambios
          </button>
        </form>
      )}
    </div>
  )
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null
  const number = Number(value.replace(',', '.'))
  return Number.isFinite(number) ? number : null
}

function toLocalInputValue(value: string) {
  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}
