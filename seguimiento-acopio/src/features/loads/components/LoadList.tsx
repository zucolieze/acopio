import { formatDate, formatKilos } from '../../../utils/format'
import type { Load } from '../types'

type LoadListProps = {
  entries: Load[]
  profileNames: Record<string, string>
}

export function LoadList({ entries, profileNames }: LoadListProps) {
  if (entries.length === 0) {
    return <p className="empty-loads">Todavía no se cargaron pesadas.</p>
  }

  return (
    <ul className="load-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <div className="load-list__details">
            <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            <span>
              Cargó{' '}
              {entry.created_by
                ? profileNames[entry.created_by] ?? 'Integrante del grupo'
                : 'Integrante del grupo'}
            </span>
          </div>
          <strong>{formatKilos(entry.kg)} kg</strong>
        </li>
      ))}
    </ul>
  )
}
