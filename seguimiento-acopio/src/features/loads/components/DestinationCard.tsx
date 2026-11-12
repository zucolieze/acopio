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
  /** Si el destino es de otro trabajo (fijado), de cuál. */
  origin?: string
  /** Fijar o soltar el destino entre los trabajos del carrero. */
  pin?: { pinned: boolean; onToggle: () => void }
  loadingLot: string
  cerealMismatch: string
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
  origin,
  pin,
  loadingLot,
  cerealMismatch,
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
      <DestinationHeading
        destination={destination}
        entries={entries}
        compact={isProvider}
        action={
          pin && (
            <button
              className={pin.pinned ? 'pin-button is-pinned' : 'pin-button'}
              type="button"
              disabled={busy}
              aria-pressed={pin.pinned}
              title={pin.pinned ? 'Quitar de mis otros trabajos' : 'Fijar en todos mis trabajos'}
              onClick={pin.onToggle}
            >
              <PinIcon />
              <span>{pin.pinned ? 'Fijado' : 'Fijar'}</span>
            </button>
          )
        }
      />
      {/* El carrero ve lo justo para cargar; el detalle queda en las otras pestañas. */}
      {!isProvider && <p className="destination-card__lot">{location}</p>}
      {!isProvider && origin && <p className="destination-card__origin">{origin}</p>}
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
            {cerealMismatch && (
              <p className="feedback feedback--error load-form__warning" role="alert">
                {cerealMismatch}
              </p>
            )}
            <button
              className="button button--primary button--large"
              disabled={busy || Boolean(cerealMismatch)}
            >
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

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M15 3a1 1 0 0 1 .7 1.7L14.4 6l2.3 4.6 1.6.4a1 1 0 0 1 .5 1.7L15.4 16l3.3 3.3a1 1 0 0 1-1.4 1.4L14 17.4l-3.3 3.4a1 1 0 0 1-1.7-.5l-.4-1.6L4 16.4a1 1 0 0 1-.2-1.7l.1-.1L8 10.5 12.3 4.3A1 1 0 0 1 13 4z"
      />
    </svg>
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
