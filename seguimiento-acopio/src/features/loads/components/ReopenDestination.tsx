import { useState } from 'react'
import {
  formatHumidityInput,
  HUMIDITY_ERROR,
  HUMIDITY_PATTERN,
  parseHumidity,
} from '@/shared/utils/humidity'
import type { Destination } from '../types'

type ReopenDestinationProps = {
  destination: Destination
  busy: boolean
  onReopen: (destination: Destination, openingHumidity: number | null) => void
}

// Reactivar un destino cerrado: vuelve a Activos como un destino nuevo. Los
// silos y silobolsas piden una humedad inicial nueva; las anteriores se guardan.
export function ReopenDestination({ destination, busy, onReopen }: ReopenDestinationProps) {
  const [open, setOpen] = useState(false)
  const [humidity, setHumidity] = useState('')
  const needsHumidity = destination.destination_type !== 'camion'
  const parsed = parseHumidity(humidity)

  if (!open) {
    return (
      <button
        className="button button--secondary destination-card__reopen"
        type="button"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Reactivar destino
      </button>
    )
  }

  return (
    <form
      className="reopen-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (needsHumidity && parsed === null) return
        onReopen(destination, needsHumidity ? parsed : null)
        setOpen(false)
        setHumidity('')
      }}
    >
      <p className="muted small-copy">
        {needsHumidity
          ? 'El destino vuelve a Activos como uno nuevo. Cargá la humedad inicial de esta nueva etapa; las humedades anteriores se conservan para el promedio.'
          : 'El camión vuelve a Activos como un destino nuevo.'}
      </p>
      {needsHumidity && (
        <label>
          Humedad inicial nueva (%)
          <input
            autoComplete="off"
            inputMode="decimal"
            maxLength={4}
            pattern={HUMIDITY_PATTERN}
            placeholder="Ej.: 14.5"
            required
            title={HUMIDITY_ERROR}
            type="text"
            value={humidity}
            onChange={(event) => setHumidity(formatHumidityInput(event.target.value))}
          />
        </label>
      )}
      <div className="reopen-form__actions">
        <button
          className="button button--primary"
          type="submit"
          disabled={busy || (needsHumidity && parsed === null)}
        >
          {busy ? 'Reactivando…' : 'Reactivar'}
        </button>
        <button className="link-button" type="button" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
