import type { ReactNode } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './PieDePagina.module.css'

/** Con `alFinal` el contenido va a la derecha y se separa de lo anterior. */
export function PieDePagina({ alFinal, children }: { alFinal?: boolean; children: ReactNode }) {
  return <footer className={unirClases(estilos.pie, alFinal && estilos.alFinal)}>{children}</footer>
}
