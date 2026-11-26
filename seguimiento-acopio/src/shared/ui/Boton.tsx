import type { ComponentPropsWithoutRef } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './Boton.module.css'

export type VarianteBoton =
  | 'primaria'
  | 'secundaria'
  | 'silenciosa'
  | 'peligro'
  | 'google'
  | 'enlace'
  | 'enlacePeligro'

type PropsBoton = ComponentPropsWithoutRef<'button'> & {
  variante: VarianteBoton
  tamano?: 'chico' | 'grande'
}

const clasesPorVariante: Record<VarianteBoton, string> = {
  primaria: unirClases(estilos.boton, estilos.primaria),
  secundaria: unirClases(estilos.boton, estilos.secundaria),
  silenciosa: unirClases(estilos.boton, estilos.silenciosa),
  peligro: unirClases(estilos.boton, estilos.peligro),
  google: unirClases(estilos.boton, estilos.google),
  enlace: estilos.enlace,
  enlacePeligro: unirClases(estilos.enlace, estilos.peligroEnlace),
}

/** `className` es solo para ubicar el botón desde afuera; el aspecto se elige con props. */
export function Boton({ variante, tamano, className, ...resto }: PropsBoton) {
  return (
    <button
      {...resto}
      className={unirClases(clasesPorVariante[variante], tamano && estilos[tamano], className)}
    />
  )
}
