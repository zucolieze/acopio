import type { ReactNode } from 'react'
import estilos from './EncabezadoSimple.module.css'

export function EncabezadoSimple({ children }: { children: ReactNode }) {
  return <header className={estilos.encabezado}>{children}</header>
}
