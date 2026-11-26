import type { ReactNode } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './PaginaCentrada.module.css'

/** Pantalla de una sola columna; con `arriba` el contenido no se centra en vertical. */
export function PaginaCentrada({ arriba, children }: { arriba?: boolean; children: ReactNode }) {
  return <main className={unirClases(estilos.pagina, arriba && estilos.arriba)}>{children}</main>
}
