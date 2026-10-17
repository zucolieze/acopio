import type { FormEvent } from 'react'
import { LoadList } from './LoadList'
import { DestinationHeading } from './DestinationHeading'
import { DestinationManagement } from './DestinationManagement'
import { AuditList } from './AuditList'
import type { ChangeAudit, Destination, DestinationChanges, Load, Lot } from '../types'
import { formatKilos } from '../../../utils/format'

type DestinationCardProps = {
  destination: Destination
  lotName: string
  lots: Lot[]
  entries: Load[]
  auditEntries: ChangeAudit[]
  profileNames: Record<string, string>
  isProvider: boolean
  busy: boolean
  busyId: string
  kilos: string
  closingHumidity: string
  onKilosChange: (value: string) => void
  onClosingHumidityChange: (value: string) => void
  onAddLoad: (kilos: string) => void
  onClose: (humidity: string) => void
  onEditLoad: (load: Load, kilos: string, date: string) => void
  onDeleteLoad: (load: Load) => void
  onEditDestination: (changes: DestinationChanges) => void
  onDeleteDestination: () => void
}

export function DestinationCard({
  destination,
  lotName,
  lots,
  entries,
  auditEntries,
  profileNames,
  isProvider,
  busy,
  busyId,
  kilos,
  closingHumidity,
  onKilosChange,
  onClosingHumidityChange,
  onAddLoad,
  onClose,
  onEditLoad,
  onDeleteLoad,
  onEditDestination,
  onDeleteDestination,
}: DestinationCardProps) {
  const total = entries.reduce((sum, entry) => sum + entry.kg, 0)

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
      <p className="destination-card__lot">Lote: {lotName}</p>
      {destination.destination_type === 'camion' && (
        <CapacitySummary destination={destination} total={total} />
      )}
      {destination.destination_type !== 'camion' && (
        <HumiditySummary destination={destination} />
      )}
      {isProvider && (
        <>
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
          <DestinationManagement
            destination={destination}
            lots={lots}
            busy={busy}
            onSave={onEditDestination}
            onDelete={onDeleteDestination}
          />
        </>
      )}
      <LoadList
        entries={isProvider ? entries : entries.slice(0, 3)}
        profileNames={profileNames}
        canEdit={isProvider}
        busyId={busyId}
        onEdit={onEditLoad}
        onDelete={onDeleteLoad}
      />
      {!isProvider && entries.length > 3 && (
        <p className="muted small-copy">Se muestran las últimas 3 pesadas.</p>
      )}
      {auditEntries.length > 0 && (
        <details className="audit-history-details">
          <summary>Ver cambios registrados ({auditEntries.length})</summary>
          <AuditList
            entries={auditEntries}
            profileNames={profileNames}
            lots={lots}
            destinationName={destination.name}
          />
        </details>
      )}
      {isProvider && (
        <form className="destination-card__close-form" onSubmit={handleClose}>
          {destination.destination_type !== 'camion' && (
            <label>
              Humedad de cierre (%)
              <input
                inputMode="decimal"
                max="100"
                min="0"
                placeholder="Ej.: 13.2"
                required
                step="0.01"
                type="number"
                value={closingHumidity}
                onChange={(event) => onClosingHumidityChange(event.target.value)}
              />
            </label>
          )}
          <button
            className="link-button destination-card__close"
            type="submit"
            disabled={busy}
          >
            Cerrar destino
          </button>
        </form>
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
            : `${destination.opening_humidity}%`}
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
            : `${destination.closing_humidity}%`}
          {destination.closing_humidity_at
            ? ` · ${new Date(destination.closing_humidity_at).toLocaleString('es-AR')}`
            : ''}
        </dd>
      </div>
      <div>
        <dt>Promedio</dt>
        <dd>{average === null ? 'Pendiente' : `${average.toFixed(2)}%`}</dd>
      </div>
    </dl>
  )
}
