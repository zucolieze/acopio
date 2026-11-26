import type { ReactNode } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './TarjetaDestino.module.css'

/** Recuadro de un destino; `eliminado` lo muestra atenuado y con borde punteado. */
export function TarjetaDestino({ eliminado, children }: { eliminado?: boolean; children: ReactNode }) {
  return (
    <article className={unirClases(estilos.tarjeta, eliminado && estilos.eliminada)}>
      {children}
    </article>
  )
}
