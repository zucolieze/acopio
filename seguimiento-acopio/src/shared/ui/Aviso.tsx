import { useEffect, useState, type ReactNode } from 'react'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './Aviso.module.css'

type PropsAviso = {
  variante: 'error' | 'aviso'
  className?: string
  children: ReactNode
}

export function Aviso({ variante, className, children }: PropsAviso) {
  return (
    <p
      className={unirClases(estilos.mensaje, estilos[variante], className)}
      role={variante === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}

// Los avisos de acción completada se van solos a los 10 segundos; los errores
// quedan a la vista hasta que la persona hace otra cosa.
const SEGUNDOS_AVISO = 10

export function Avisos({ error, aviso }: { error: string; aviso: string }) {
  const [avisoOculto, setAvisoOculto] = useState('')

  useEffect(() => {
    if (!aviso) return
    setAvisoOculto('')
    const temporizador = window.setTimeout(() => setAvisoOculto(aviso), SEGUNDOS_AVISO * 1000)
    return () => window.clearTimeout(temporizador)
  }, [aviso])

  return (
    <>
      {error && <Aviso variante="error">{error}</Aviso>}
      {aviso && aviso !== avisoOculto && <Aviso variante="aviso">{aviso}</Aviso>}
    </>
  )
}
