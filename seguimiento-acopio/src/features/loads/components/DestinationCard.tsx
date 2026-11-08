import type { FormEvent } from 'react'
import { DestinationHeading } from './DestinationHeading'
import type { Destination, Load } from '../types'
import { formatKilos } from '../../../utils/format'
import {
  formatHumidityInput,
  HUMIDITY_ERROR,
  HUMIDITY_PATTERN,
  formatHumidity,
  parseHumidity,
} from '../../../utils/humidity'

type DestinationCardProps = {
  destination: Destination
  location: string
  loadingLot: string
  entries: Load[]
  isProvider: boolean
  busy: boolean
  kilos: string
  closingHumidity: string
  onKilosChange: (value: string) => void
  onClosingHumidityChange: (value: string) => void
  onAddLoad: (kilos: string) => void
  onClose: (humidity: string) => void
  onDelete: () => void
}

export function DestinationCard({
  destination,
  location,
  loadingLot,
  entries,
  isProvider,
  busy,
  kilos,
  closingHumidity,
  onKilosChange,
  onClosingHumidityChange,
  onAddLoad,
  onClose,
  onDelete,
}: DestinationCardProps) {
  const total = entries.reduce((sum, entry) => sum + entry.kg, 0)
  const isEmpty = entries.length === 0
  const limitReached =
    destination.capacity_kg !== null && total >= destination.capacity_kg

  function handleAddLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onAddLoad(kilos)
  }

  function handleClose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onClose(closingHumidity)
  }

  return (
    <article className="destination-card">
      <DestinationHeading destination={destination} entries={entries} />
      <p className="destination-card__lot">{location}</p>
      {isProvider && (
        <>
          <form className="load-form" onSubmit={handleAddLoad}>
            <label>
              Kilos de esta pesada{loadingLot ? ` · ${loadingLot}` : ''}
              <input
                inputMode="decimal"
                min="0.01"
                placeholder="Ej.: 12500"
                required
                step="0.01"
                type="number"
                value={kilos}
                onChange={(event) => onKilosChange(event.target.value)}
              />
            </label>
            <button className="button button--primary button--large" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar pesada'}
            </button>
          </form>
        </>
      )}
      {destination.destination_type === 'camion' && (
        <CapacitySummary destination={destination} total={total} />
      )}
      {isProvider && isEmpty && (
        <button
          className="button button--danger button--large destination-card__delete"
          type="button"
          disabled={busy}
          onClick={onDelete}
        >
          Eliminar {destination.destination_type === 'camion' ? 'camión' : 'destino'} (no
          tiene cargas)
        </button>
      )}
      {isProvider && !isEmpty && destination.destination_type !== 'camion' && (
        <form className="destination-card__close-form" onSubmit={handleClose}>
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
              onChange={(event) => onClosingHumidityChange(formatHumidityInput(event.target.value))}
            />
          </label>
          <button
            className="button button--danger"
            type="submit"
            disabled={busy || parseHumidity(closingHumidity) === null}
          >
            Cerrar silo con humedad
          </button>
        </form>
      )}
      {isProvider && !isEmpty && destination.destination_type === 'camion' && (
        <button
          className={
            limitReached
              ? 'button button--danger button--large destination-card__close is-urgent'
              : 'link-button destination-card__close'
          }
          type="button"
          disabled={busy}
          onClick={() => onClose('')}
        >
          Cerrar camión
        </button>
      )}
    </article>
  )
}

export function CapacitySummary({
  destination,
  total,
}: {
  destination: Destination
  total: number
}) {
  if (destination.capacity_kg === null) {
    return <p className="capacity-summary">No hay un límite configurado.</p>
  }

  const difference = total - destination.capacity_kg
  const state = difference < 0 ? 'is-under' : difference > 0 ? 'is-over' : 'is-exact'
  const label =
    difference < 0
      ? `Faltan ${formatKilos(Math.abs(difference))} kg para el límite`
      : difference > 0
        ? `Se pasó ${formatKilos(difference)} kg del límite`
        : 'Llegó justo al límite'

  return (
    <p className={`capacity-summary ${state}`}>
      Límite: {formatKilos(destination.capacity_kg)} kg · {label}
    </p>
  )
}

export function HumiditySummary({ destination }: { destination: Destination }) {
  const average =
    destination.opening_humidity !== null && destination.closing_humidity !== null
      ? (destination.opening_humidity + destination.closing_humidity) / 2
      : null

  return (
    <dl className="humidity-summary">
      <div>
        <dt>Humedad inicial</dt>
        <dd>
          {destination.opening_humidity === null
            ? 'Sin dato'
            : formatHumidity(destination.opening_humidity)}
          {destination.opening_humidity_at
            ? ` · ${new Date(destination.opening_humidity_at).toLocaleString('es-AR')}`
            : ''}
        </dd>
      </div>
      <div>
        <dt>Humedad de cierre</dt>
        <dd>
          {destination.closing_humidity === null
            ? 'Pendiente'
            : formatHumidity(destination.closing_humidity)}
          {destination.closing_humidity_at
            ? ` · ${new Date(destination.closing_humidity_at).toLocaleString('es-AR')}`
            : ''}
        </dd>
      </div>
      <div>
        <dt>Promedio</dt>
        <dd>{average === null ? 'Pendiente' : formatHumidity(average)}</dd>
      </div>
    </dl>
  )
}
