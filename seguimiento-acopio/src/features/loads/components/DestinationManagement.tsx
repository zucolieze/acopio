import { useState } from 'react'
import type { FormEvent } from 'react'
import type { DestinationChanges, Destination, Lot } from '../types'
import type { DestinationType } from '../../../lib/database.types'
import { cerealOptions, destinationLabels } from '../types'
import { isArgentinePlate, normalizePlate } from '../../../utils/plates'
import {
  formatHumidityInput,
  humidityToInput,
  HUMIDITY_ERROR,
  HUMIDITY_PATTERN,
  parseHumidity,
} from '../../../utils/humidity'

type DestinationManagementProps = {
  destination: Destination
  lots: Lot[]
  busy: boolean
  onSave: (changes: DestinationChanges) => void
  onChangeLotCereal: (lot: Lot, cereal: string) => void
  onDelete: () => void
}

export function DestinationManagement({
  destination,
  lots,
  busy,
  onSave,
  onChangeLotCereal,
  onDelete,
}: DestinationManagementProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(destination.name)
  const [lotId, setLotId] = useState(destination.lot_id)
  const [cereal, setCereal] = useState(
    lots.find((lot) => lot.id === destination.lot_id)?.cereal ?? '',
  )
  const [type, setType] = useState<DestinationType>(destination.destination_type)
  const [capacity, setCapacity] = useState(
    destination.capacity_kg === null ? '' : String(destination.capacity_kg),
  )
  const [openingHumidity, setOpeningHumidity] = useState(
    humidityToInput(destination.opening_humidity),
  )
  const [openingAt, setOpeningAt] = useState(
    destination.opening_humidity_at ? toLocalInputValue(destination.opening_humidity_at) : '',
  )
  const [closingHumidity, setClosingHumidity] = useState(
    humidityToInput(destination.closing_humidity),
  )
  const [closingAt, setClosingAt] = useState(
    destination.closing_humidity_at ? toLocalInputValue(destination.closing_humidity_at) : '',
  )
  const [closedAt, setClosedAt] = useState(
    destination.closed_at ? toLocalInputValue(destination.closed_at) : '',
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      type === 'camion' &&
      name !== destination.name &&
      !isArgentinePlate(name) &&
      !window.confirm(
        `La patente ${name} no tiene el formato argentino (ABC123 o AA123BB). ¿Es de otro país y la querés guardar así?`,
      )
    ) {
      return
    }
    const changes: DestinationChanges = {
      lot_id: lotId,
      destination_type: type,
      name: name.trim(),
      capacity_kg: type === 'camion' ? parseOptionalNumber(capacity) : null,
      opening_humidity:
        type === 'camion' ? null : parseHumidity(openingHumidity),
      opening_humidity_at:
        type === 'camion' || !openingAt ? null : new Date(openingAt).toISOString(),
      closing_humidity:
        type === 'camion' ? null : parseHumidity(closingHumidity),
      closing_humidity_at:
        type === 'camion' || !closingAt ? null : new Date(closingAt).toISOString(),
      closed_at: closedAt ? new Date(closedAt).toISOString() : null,
    }
    onSave(changes)
    const lot = lots.find((item) => item.id === lotId)
    if (lot && cereal && cereal !== lot.cereal) onChangeLotCereal(lot, cereal)
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
            {type === 'camion' ? 'Patente' : 'Nombre'}
            <input
              autoCapitalize={type === 'camion' ? 'characters' : undefined}
              maxLength={type === 'camion' ? 10 : 120}
              minLength={type === 'camion' ? 4 : undefined}
              required
              value={name}
              onChange={(event) =>
                setName(
                  type === 'camion'
                    ? normalizePlate(event.target.value)
                    : event.target.value,
                )
              }
            />
          </label>
          <label>
            Lote
            <select
              required
              value={lotId}
              onChange={(event) => {
                setLotId(event.target.value)
                setCereal(lots.find((lot) => lot.id === event.target.value)?.cereal ?? '')
              }}
            >
              {lots.map((lot) => (
                <option
                  key={lot.id}
                  value={lot.id}
                  disabled={lot.deleted_at !== null && lot.id !== destination.lot_id}
                >
                  {lot.name}{lot.cereal ? ` · ${lot.cereal}` : ''}
                  {lot.deleted_at ? ' (eliminado)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cereal del lote
            <select value={cereal} onChange={(event) => setCereal(event.target.value)}>
              {!cereal && <option value="">Sin cereal</option>}
              {cerealOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span className="muted small-copy">
              Cambia el cereal de todo el lote. No se permite si quedaría mezclado en un destino.
            </span>
          </label>
          <label>
            Tipo de destino
            <select
              value={type}
              onChange={(event) => {
                const nextType = event.target.value as DestinationType
                setType(nextType)
                if (nextType === 'camion') {
                  setName((current) =>
                    normalizePlate(current),
                  )
                }
              }}
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
                  autoComplete="off"
                  inputMode="decimal"
                  maxLength={4}
                  pattern={HUMIDITY_PATTERN}
                  placeholder="Ej.: 14.5"
                  required
                  title={HUMIDITY_ERROR}
                  type="text"
                  value={openingHumidity}
                  onChange={(event) => setOpeningHumidity(formatHumidityInput(event.target.value))}
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
                      autoComplete="off"
                      inputMode="decimal"
                      maxLength={4}
                      pattern={HUMIDITY_PATTERN}
                      placeholder="Ej.: 13.2"
                      required
                      title={HUMIDITY_ERROR}
                      type="text"
                      value={closingHumidity}
                      onChange={(event) => setClosingHumidity(formatHumidityInput(event.target.value))}
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
