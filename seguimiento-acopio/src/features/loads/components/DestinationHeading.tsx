import type { ReactNode } from 'react'
import { formatDate, formatKilos } from '../../../utils/format'
import { destinationLabels } from '../types'
import type { Destination, Load } from '../types'

type DestinationHeadingProps = {
  destination: Destination
  entries: Load[]
  closed?: boolean
  deleted?: boolean
  /** Vista simple para el carrero en Activos: sin la cantidad de descargas. */
  compact?: boolean
  /** Acción en la esquina superior (por ejemplo, el pin). */
  action?: ReactNode
}

export function DestinationHeading({
  destination,
  entries,
  closed = false,
  deleted = false,
  compact = false,
  action,
}: DestinationHeadingProps) {
  const total = entries.reduce((sum, entry) => sum + entry.kg, 0)

  return (
    <div className="destination-heading">
      <div className="destination-heading__topline">
        <span className={deleted ? 'status-badge is-deleted' : closed ? 'status-badge is-closed' : 'status-badge'}>
          {deleted ? 'Eliminado' : closed ? 'Cerrado' : 'Activo'}
        </span>
        <span className="destination-heading__type">
          {destinationLabels[destination.destination_type]}
        </span>
        {destination.pinned && !closed && !deleted && !action && (
          <span className="status-badge is-pinned">Fijado</span>
        )}
        {action && <span className="destination-heading__action">{action}</span>}
      </div>
      <div className="destination-heading__body">
        <div>
          <h2>{destination.name}</h2>
          {!compact && (
          <p className="muted">
            {entries.length} {entries.length === 1 ? 'descarga' : 'descargas'}
            {closed && destination.closed_at
              ? ` · Cerrado ${formatDate(destination.closed_at)}`
              : ''}
          </p>
          )}
        </div>
        <strong className="destination-total">{formatKilos(total)} kg</strong>
      </div>
    </div>
  )
}
