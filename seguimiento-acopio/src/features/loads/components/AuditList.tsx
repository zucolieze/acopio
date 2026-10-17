import { formatKilos } from '../../../utils/format'
import type { ChangeAudit, Lot } from '../types'

const fieldLabels: Record<string, string> = {
  kg: 'Kilos',
  date: 'Fecha de pesada',
  name: 'Nombre',
  lot_id: 'Lote',
  destination_type: 'Tipo de destino',
  capacity_kg: 'Límite del camión',
  opening_humidity: 'Humedad inicial',
  opening_humidity_at: 'Fecha de humedad inicial',
  closing_humidity: 'Humedad de cierre',
  closing_humidity_at: 'Fecha de humedad de cierre',
  closed_at: 'Fecha de cierre',
  status: 'Estado',
  deleted_at: 'Eliminación',
}

type AuditListProps = {
  entries: ChangeAudit[]
  profileNames: Record<string, string>
  lots?: Lot[]
  destinationName?: string
}

export function AuditList({
  entries,
  profileNames,
  lots = [],
  destinationName,
}: AuditListProps) {
  if (entries.length === 0) {
    return <p className="muted small-copy">Todavía no hay cambios registrados.</p>
  }

  return (
    <section className="audit-history">
      <h3>Ediciones y eliminaciones</h3>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <div>
              <strong>
                {entry.action === 'eliminar' ? 'Se eliminó' : 'Se editó'}{' '}
                {entityLabel(entry.entity_type)}
                {entry.entity_type === 'carga' && destinationName
                  ? ` de ${destinationName}`
                  : ''}
              </strong>
              <span>
                {new Date(entry.occurred_at).toLocaleString('es-AR')} ·{' '}
                {entry.actor_id
                  ? profileNames[entry.actor_id] ?? 'Integrante del grupo'
                  : 'Integrante del grupo'}
              </span>
            </div>
            <ul className="audit-history__changes">
              {Object.entries(entry.changes).map(([field, values]) => (
                <li key={field}>
                  {fieldLabels[field] ?? field}: {displayValue(field, values.antes, lots)} →{' '}
                  {displayValue(field, values.despues, lots)}
                </li>
              ))}
            </ul>
            {entry.kg_delta !== null && entry.kg_delta !== 0 && (
              <p className="small-copy">
                Diferencia: {entry.kg_delta > 0 ? '+' : ''}
                {formatKilos(entry.kg_delta)} kg
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function entityLabel(entity: ChangeAudit['entity_type']) {
  switch (entity) {
    case 'carga':
      return 'pesada'
    case 'destino':
      return 'destino'
    case 'lote':
      return 'lote'
    case 'trabajo':
      return 'trabajo'
  }
}

function displayValue(field: string, value: unknown, lots: Lot[]) {
  if (value === null || value === undefined) return 'vacío'
  if (field.endsWith('_at') || field === 'date') {
    const parsed = new Date(String(value))
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('es-AR')
  }
  if (field === 'kg' || field === 'capacity_kg') return formatKilos(Number(value))
  if (field.includes('humidity')) return `${value}%`
  if (field === 'destination_type') {
    return value === 'camion' ? 'Camión' : value === 'silo' ? 'Silo' : 'Silobolsa'
  }
  if (field === 'lot_id') {
    return lots.find((lot) => lot.id === value)?.name ?? 'Lote eliminado'
  }
  if (field === 'status') return value === 'cerrado' ? 'Cerrado' : 'Activo'
  if (field === 'deleted_at') return value === null ? 'No eliminado' : 'Eliminado'
  return String(value)
}
