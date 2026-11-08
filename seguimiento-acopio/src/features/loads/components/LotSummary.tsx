import { useState } from 'react'
import { formatKilos } from '../../../utils/format'
import type { Destination, Load, Lot, LotChanges } from '../types'

type LotSummaryProps = {
  lots: Lot[]
  destinations: Destination[]
  loadsByDestination: Map<string, Load[]>
  canEditHectares: boolean
  busy: string
  onUpdateLot: (lot: Lot, changes: LotChanges) => void
}

type LotRow = {
  lot: Lot
  destinations: number
  loads: number
  kilos: number
}

// Agrupa las descargas por el lote del que vienen (un mismo destino puede tener
// descargas de varios lotes) y calcula el rendimiento si el lote tiene hectáreas.
export function LotSummary({
  lots,
  destinations,
  loadsByDestination,
  canEditHectares,
  busy,
  onUpdateLot,
}: LotSummaryProps) {
  const loads = destinations.flatMap(
    (destination) => loadsByDestination.get(destination.id) ?? [],
  )
  const rows: LotRow[] = lots
    .map((lot) => {
      const lotLoads = loads.filter((load) => load.lot_id === lot.id)
      const destinationIds = new Set(lotLoads.map((load) => load.destination_id))
      for (const destination of destinations) {
        if (destination.lot_id === lot.id) destinationIds.add(destination.id)
      }
      return {
        lot,
        destinations: destinationIds.size,
        loads: lotLoads.length,
        kilos: lotLoads.reduce((sum, load) => sum + load.kg, 0),
      }
    })
    .filter((row) => row.lot.deleted_at === null || row.loads > 0)

  if (rows.length === 0) {
    return <p className="muted small-copy">Todavía no hay lotes en este trabajo.</p>
  }

  const byCereal = new Map<string, number>()
  for (const row of rows) {
    const cereal = row.lot.cereal ?? 'Sin cereal'
    byCereal.set(cereal, (byCereal.get(cereal) ?? 0) + row.kilos)
  }

  return (
    <section className="lot-summary" aria-labelledby="lot-summary-title">
      <h3 id="lot-summary-title">Kilos y rendimiento por lote</h3>
      <ul className="lot-summary__list">
        {rows.map((row) => (
          <LotSummaryItem
            key={row.lot.id}
            row={row}
            canEditHectares={canEditHectares}
            busy={busy === row.lot.id}
            onUpdateLot={onUpdateLot}
          />
        ))}
      </ul>
      <p className="lot-summary__totals">
        Total por cereal:{' '}
        {[...byCereal.entries()]
          .map(([cereal, kilos]) => `${cereal} ${formatKilos(kilos)} kg`)
          .join(' · ')}
      </p>
    </section>
  )
}

function LotSummaryItem({
  row,
  canEditHectares,
  busy,
  onUpdateLot,
}: {
  row: LotRow
  canEditHectares: boolean
  busy: boolean
  onUpdateLot: LotSummaryProps['onUpdateLot']
}) {
  const [editing, setEditing] = useState(false)
  const [hectares, setHectares] = useState(
    row.lot.hectares === null ? '' : String(row.lot.hectares),
  )
  const kgPerHa = row.lot.hectares ? row.kilos / row.lot.hectares : null

  return (
    <li className="lot-summary__item">
      <div className="lot-summary__heading">
        <span>
          Lote: <strong>{row.lot.name}</strong>
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
          <dt>Descargas</dt>
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
      {canEditHectares && !editing && (
        <button
          className="link-button lot-summary__edit"
          type="button"
          disabled={busy}
          onClick={() => {
            setHectares(row.lot.hectares === null ? '' : String(row.lot.hectares))
            setEditing(true)
          }}
        >
          {row.lot.hectares ? `Hectáreas: ${row.lot.hectares} · Cambiar` : 'Cargar hectáreas'}
        </button>
      )}
      {canEditHectares && editing && (
        <form
          className="lot-summary__form"
          onSubmit={(event) => {
            event.preventDefault()
            const value = hectares.trim() ? Number(hectares.replace(',', '.')) : null
            onUpdateLot(row.lot, { hectares: value })
            setEditing(false)
          }}
        >
          <label>
            Hectáreas del lote
            <input
              inputMode="decimal"
              min="0.01"
              placeholder="Ej.: 45"
              step="0.01"
              type="number"
              value={hectares}
              onChange={(event) => setHectares(event.target.value)}
            />
          </label>
          <button className="button button--secondary button--small" type="submit" disabled={busy}>
            Guardar
          </button>
          <button className="link-button" type="button" onClick={() => setEditing(false)}>
            Cancelar
          </button>
        </form>
      )}
    </li>
  )
}
