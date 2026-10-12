import { formatDate, formatKilos } from '../../../utils/format'
import { destinationLabels } from '../types'
import type { Destination, Load } from '../types'

type DestinationHeadingProps = {
  destination: Destination
  entries: Load[]
  closed?: boolean
}

export function DestinationHeading({
  destination,
  entries,
  closed = false,
}: DestinationHeadingProps) {
  const total = entries.reduce((sum, entry) => sum + entry.kg, 0)

  return (
    <div className="destination-heading">
      <div className="destination-heading__topline">
        <span className={closed ? 'status-badge is-closed' : 'status-badge'}>
          {closed ? 'Cerrado' : 'Activo'}
        </span>
        <span className="destination-heading__type">
          {destinationLabels[destination.destination_type]}
        </span>
      </div>
      <div className="destination-heading__body">
        <div>
          <h2>{destination.name}</h2>
          <p className="muted">
            {entries.length} {entries.length === 1 ? 'pesada' : 'pesadas'}
            {closed && destination.closed_at
              ? ` · Cerrado ${formatDate(destination.closed_at)}`
              : ''}
          </p>
        </div>
        <strong className="destination-total">{formatKilos(total)} kg</strong>
      </div>
    </div>
  )
}
