import type { ReactNode } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './TextoSuave.module.css'

type PropsTextoSuave = {
  como?: 'p' | 'span'
  chico?: boolean
  className?: string
  children: ReactNode
}

export function TextoSuave({ como: Elemento = 'p', chico, className, children }: PropsTextoSuave) {
  return (
    <Elemento className={unirClases(estilos.suave, chico && estilos.chico, className)}>
      {children}
    </Elemento>
  )
}
