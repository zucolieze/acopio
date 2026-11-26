import { unirClases } from '@/shared/utils/unirClases'
import estilos from './Pestanas.module.css'

type PropsPestanas<Id extends string> = {
  etiqueta: string
  opciones: ReadonlyArray<{ id: Id; label: string }>
  activa: Id
  alElegir: (id: Id) => void
}

export function Pestanas<Id extends string>({
  etiqueta,
  opciones,
  activa,
  alElegir,
}: PropsPestanas<Id>) {
  return (
    <nav className={estilos.pestanas} aria-label={etiqueta}>
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          className={unirClases(estilos.pestana, activa === opcion.id && estilos.activa)}
          type="button"
          aria-current={activa === opcion.id ? 'page' : undefined}
          onClick={() => alElegir(opcion.id)}
        >
          {opcion.label}
        </button>
      ))}
    </nav>
  )
}
