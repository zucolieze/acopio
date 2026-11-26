import type { ReactNode } from 'react'
import { formatDate, formatKilos } from '@/shared/utils/format'
import { destinationLabels } from '../types'
import type { Destination, Load } from '../types'
import { EtiquetaEstado } from '@/shared/ui/EtiquetaEstado'
import { TextoSuave } from '@/shared/ui/TextoSuave'
import estilos from './DestinationHeading.module.css'

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
    <div className={estilos.cabecera}>
      <div className={estilos.linea}>
        <EtiquetaEstado estado={deleted ? 'eliminado' : closed ? 'cerrado' : 'activo'} />
        <span className={estilos.tipo}>
          {destinationLabels[destination.destination_type]}
        </span>
        {destination.pinned && !closed && !deleted && !action && (
          <EtiquetaEstado estado="fijado" />
        )}
        {action && <span className={estilos.accion}>{action}</span>}
      </div>
      <div className={estilos.cuerpo}>
        <div>
          <h2>{destination.name}</h2>
          {!compact && (
          <TextoSuave className={estilos.cantidadDescargas}>
            {entries.length} {entries.length === 1 ? 'descarga' : 'descargas'}
            {closed && destination.closed_at
              ? ` · Cerrado ${formatDate(destination.closed_at)}`
              : ''}
          </TextoSuave>
          )}
        </div>
        <strong className={estilos.total}>{formatKilos(total)} kg</strong>
      </div>
    </div>
  )
}
