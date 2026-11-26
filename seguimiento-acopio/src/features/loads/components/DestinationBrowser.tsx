import { useState, type ReactNode } from 'react'
import { destinationLabels } from '../types'
import type { Destination, Lot } from '../types'
import type { DestinationType } from '@/shared/lib/database.types'

type DestinationBrowserProps = {
  destinations: Destination[]
  lots: Lot[]
  /** Lotes de cada destino (un destino puede tener descargas de varios). */
  lotIdsOf: (destination: Destination) => string[]
  lotLabel: (lotId: string) => string
  render: (destination: Destination) => ReactNode
}

const PAGE_SIZE = 8
const GROUPS: { type: DestinationType; label: string }[] = [
  { type: 'camion', label: 'Camiones' },
  { type: 'silo', label: 'Silos' },
  { type: 'silobolsa', label: 'Silobolsas' },
]

// Buscador de destinos: filtra por nombre, estado, tipo y lote, y agrupa por
// tipo (camiones, silos, silobolsas) con "Mostrar más" para que no se haga larga.
export function DestinationBrowser({
  destinations,
  lots,
  lotIdsOf,
  lotLabel,
  render,
}: DestinationBrowserProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'todos' | 'activo' | 'cerrado'>('todos')
  const [type, setType] = useState<DestinationType | 'todos'>('todos')
  const [lotId, setLotId] = useState('todos')
  const [visible, setVisible] = useState<Record<string, number>>({})

  const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, '')
  const filtering =
    normalizedQuery !== '' || status !== 'todos' || type !== 'todos' || lotId !== 'todos'

  const filtered = destinations.filter(
    (destination) =>
      (!normalizedQuery ||
        destination.name.toLowerCase().replace(/\s+/g, '').includes(normalizedQuery)) &&
      (status === 'todos' || destination.status === status) &&
      (type === 'todos' || destination.destination_type === type) &&
      (lotId === 'todos' || lotIdsOf(destination).includes(lotId)),
  )

  const groups = GROUPS.map((group) => ({
    ...group,
    items: filtered.filter((destination) => destination.destination_type === group.type),
  })).filter((group) => group.items.length > 0)

  function clearFilters() {
    setQuery('')
    setStatus('todos')
    setType('todos')
    setLotId('todos')
  }

  return (
    <section className="destination-browser" aria-label="Buscar destinos">
      <div className="destination-filters">
        <label className="destination-filters__search">
          <span className="sr-only">Buscar por nombre o patente</span>
          <input
            type="search"
            autoComplete="off"
            placeholder="Buscar por nombre o patente"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Estado</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="todos">Estados</option>
            <option value="activo">Activos</option>
            <option value="cerrado">Cerrados</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Tipo</span>
          <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
            <option value="todos">Destinos</option>
            {GROUPS.map((group) => (
              <option key={group.type} value={group.type}>
                {destinationLabels[group.type]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Lote</span>
          <select value={lotId} onChange={(event) => setLotId(event.target.value)}>
            <option value="todos">Lotes</option>
            {lots
              .filter((lot) => lot.deleted_at === null)
              .map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lotLabel(lot.id)}
                </option>
              ))}
          </select>
        </label>
      </div>
      <p className="destination-browser__count" role="status">
        {filtered.length === destinations.length
          ? `${destinations.length} ${destinations.length === 1 ? 'destino' : 'destinos'}`
          : `${filtered.length} de ${destinations.length} destinos`}
        {filtering && (
          <button className="link-button" type="button" onClick={clearFilters}>
            Limpiar filtros
          </button>
        )}
      </p>

      {groups.length === 0 ? (
        <p className="muted">No hay destinos que coincidan con la búsqueda.</p>
      ) : (
        groups.map((group, index) => {
          const shown = visible[group.type] ?? PAGE_SIZE
          return (
            <details
              className="destination-group"
              key={`${group.type}-${filtering}`}
              open={filtering || index === 0}
            >
              <summary>
                {group.label} ({group.items.length})
              </summary>
              <div className="destination-list">
                {group.items.slice(0, shown).map((destination) => render(destination))}
              </div>
              {group.items.length > shown && (
                <button
                  className="button button--secondary destination-group__more"
                  type="button"
                  onClick={() =>
                    setVisible((current) => ({ ...current, [group.type]: shown + PAGE_SIZE }))
                  }
                >
                  Mostrar más ({group.items.length - shown} restantes)
                </button>
              )}
            </details>
          )
        })
      )}
    </section>
  )
}
