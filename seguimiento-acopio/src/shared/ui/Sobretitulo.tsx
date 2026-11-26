import type { ReactNode } from 'react'
import estilos from './Sobretitulo.module.css'

/** Línea chica en mayúsculas que va arriba de un título. */
export function Sobretitulo({ children }: { children: ReactNode }) {
  return <p className={estilos.sobretitulo}>{children}</p>
}
