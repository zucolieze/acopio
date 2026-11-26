import type { ComponentPropsWithoutRef } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './ListaDestinos.module.css'

type PropsListaDestinos = ComponentPropsWithoutRef<'div'> & { como?: 'div' | 'section' }

export function ListaDestinos({ como: Elemento = 'div', className, ...resto }: PropsListaDestinos) {
  return <Elemento {...resto} className={unirClases(estilos.lista, className)} />
}
