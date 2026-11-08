import { formatKilos } from '../../../utils/format'
import type { Destination, Field, Load, Lot } from '../types'

type LotSummaryProps = {
  fields: Field[]
  lots: Lot[]
  destinations: Destination[]
  loadsByDestination: Map<string, Load[]>
}

type LotRow = {
  lot: Lot
  fieldName: string
  destinations: number
  loads: number
  kilos: number
}

// Agrupa destinos y pesadas por lote para ver cuánto rindió cada uno.
// El rendimiento se calcula solo si el lote tiene cargadas sus hectáreas.
export function LotSummary({ fields, lots, destinations, loadsByDestination }: LotSummaryProps) {
  const fieldNames = new Map(fields.map((field) => [field.id, field.name]))
  const rows: LotRow[] = lots
    .map((lot) => {
      const lotDestinations = destinations.filter((destination) => destination.lot_id === lot.id)
      const lotLoads = lotDestinations.flatMap(
        (destination) => loadsByDestination.get(destination.id) ?? [],
      )
      return {
        lot,
        fieldName: fieldNames.get(lot.field_id) ?? 'Campo',
        destinations: lotDestinations.length,
        loads: lotLoads.length,
        kilos: lotLoads.reduce((sum, load) => sum + load.kg, 0),
      }
    })
    .filter((row) => row.lot.deleted_at === null || row.loads > 0)

  if (rows.length === 0) return null

  const byCereal = new Map<string, number>()
  for (const row of rows) {
    const cereal = row.lot.cereal ?? 'Sin cereal'
    byCereal.set(cereal, (byCereal.get(cereal) ?? 0) + row.kilos)
  }

  return (
    <section className="lot-summary panel" aria-labelledby="lot-summary-title">
      <h2 id="lot-summary-title">Rendimiento por lote</h2>
      <ul className="lot-summary__list">
        {rows.map((row) => {
          const kgPerHa = row.lot.hectares ? row.kilos / row.lot.hectares : null
          return (
            <li key={row.lot.id} className="lot-summary__item">
              <div className="lot-summary__heading">
                <span>
                  Campo: <strong>{row.fieldName}</strong> · Lote: <strong>{row.lot.name}</strong>
                  {row.lot.deleted_at ? ' (eliminado)' : ''}
                </span>
                <span className="lot-summary__cereal">{row.lot.cereal ?? 'Sin cereal'}</span>
              </div>
              <dl className="lot-summary__stats">
                <div>
                  <dt>Kilos</dt>
                  <dd>{formatKilos(row.kilos)} kg</dd>
                </div>
                <div>
                  <dt>Destinos</dt>
                  <dd>{row.destinations}</dd>
                </div>
                <div>
                  <dt>Pesadas</dt>
                  <dd>{row.loads}</dd>
                </div>
                <div>
                  <dt>Rendimiento</dt>
                  <dd>
                    {kgPerHa === null
                      ? 'Faltan las hectáreas'
                      : `${formatKilos(kgPerHa)} kg/ha · ${(kgPerHa / 100).toFixed(1)} qq/ha`}
                  </dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
      {byCereal.size > 1 && (
        <p className="lot-summary__totals">
          Total por cereal:{' '}
          {[...byCereal.entries()]
            .map(([cereal, kilos]) => `${cereal} ${formatKilos(kilos)} kg`)
            .join(' · ')}
        </p>
      )}
    </section>
  )
}
