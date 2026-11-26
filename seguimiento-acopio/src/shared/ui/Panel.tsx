import type { ComponentPropsWithoutRef, ElementType } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './Panel.module.css'

type PropsPanel<E extends ElementType> = { como?: E } & ComponentPropsWithoutRef<E>

export function Panel<E extends ElementType = 'section'>({
  como,
  className,
  ...resto
}: PropsPanel<E>) {
  const Elemento: ElementType = como ?? 'section'
  return <Elemento {...resto} className={unirClases(estilos.panel, className)} />
}
