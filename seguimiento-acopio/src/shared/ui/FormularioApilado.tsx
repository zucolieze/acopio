import type { ComponentPropsWithoutRef } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './FormularioApilado.module.css'

/** Formulario en una columna, con cada etiqueta arriba de su campo. */
export function FormularioApilado({ className, ...resto }: ComponentPropsWithoutRef<'form'>) {
  return <form {...resto} className={unirClases(estilos.apilado, className)} />
}

/** El mismo diseño para campos que no se envían como formulario. */
export function CamposApilados({ className, ...resto }: ComponentPropsWithoutRef<'div'>) {
  return <div {...resto} className={unirClases(estilos.apilado, className)} />
}
