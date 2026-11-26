import type { ReactNode } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './FilaAcciones.module.css'

/** Acciones en una fila que baja de línea si no entran. */
export function FilaAcciones({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={unirClases(estilos.fila, className)}>{children}</div>
}
