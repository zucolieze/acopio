import type { ReactNode } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './TextoSuave.module.css'

type PropsTextoSuave = {
  como?: 'p' | 'span'
  chico?: boolean
  className?: string
  role?: 'status'
  children: ReactNode
}

export function TextoSuave({ como: Elemento = 'p', chico, className, role, children }: PropsTextoSuave) {
  return (
    <Elemento role={role} className={unirClases(estilos.suave, chico && estilos.chico, className)}>
      {children}
    </Elemento>
  )
}
