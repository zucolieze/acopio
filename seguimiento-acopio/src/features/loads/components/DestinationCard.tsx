import type { FormEvent } from 'react'
import { LoadList } from './LoadList'
import { DestinationHeading } from './DestinationHeading'
import type { Destination, Load } from '../types'

type DestinationCardProps = {
  destination: Destination
  entries: Load[]
  profileNames: Record<string, string>
  isProvider: boolean
  busy: boolean
  kilos: string
  onKilosChange: (value: string) => void
  onAddLoad: (kilos: string) => void
  onClose: () => void
}

export function DestinationCard({
  destination,
  entries,
  profileNames,
  isProvider,
  busy,
  kilos,
  onKilosChange,
  onAddLoad,
  onClose,
}: DestinationCardProps) {
  function handleAddLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onAddLoad(kilos)
  }

  return (
    <article className="destination-card">
      <DestinationHeading destination={destination} entries={entries} />
      {isProvider && (
        <form className="load-form" onSubmit={handleAddLoad}>
          <label>
            Kilos de esta pesada
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
      )}
      <LoadList entries={entries.slice(0, 3)} profileNames={profileNames} />
      {entries.length > 3 && (
        <p className="muted small-copy">Se muestran las últimas 3 pesadas.</p>
      )}
      {isProvider && (
        <button
          className="link-button destination-card__close"
          type="button"
          disabled={busy}
          onClick={onClose}
        >
          Cerrar destino
        </button>
      )}
    </article>
  )
}
