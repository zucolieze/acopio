import { unirClases } from '@/shared/utils/unirClases'
import estilos from './EtiquetaEstado.module.css'

const textos = {
  activo: 'Activo',
  cerrado: 'Cerrado',
  eliminado: 'Eliminado',
  fijado: 'Fijado',
}

export function EtiquetaEstado({ estado }: { estado: keyof typeof textos }) {
  return <span className={unirClases(estilos.etiqueta, estilos[estado])}>{textos[estado]}</span>
}
