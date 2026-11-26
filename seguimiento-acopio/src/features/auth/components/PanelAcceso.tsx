import type { ReactNode } from 'react'
import { Panel } from '@/shared/ui/Panel'
import { TextoSuave } from '@/shared/ui/TextoSuave'
import estilos from './PanelAcceso.module.css'

type PropsPanelAcceso = {
  sobretitulo: string
  titulo: string
  introduccion?: ReactNode
  children: ReactNode
}

/** Tarjeta angosta de las pantallas de ingreso y de datos de la cuenta. */
export function PanelAcceso({ sobretitulo, titulo, introduccion, children }: PropsPanelAcceso) {
  return (
    <Panel className={estilos.panel}>
      <p className={estilos.sobretitulo}>{sobretitulo}</p>
      <h1>{titulo}</h1>
      {introduccion && <TextoSuave className={estilos.introduccion}>{introduccion}</TextoSuave>}
      {children}
    </Panel>
  )
}
