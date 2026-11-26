import { useState } from 'react'
import { Boton } from '@/shared/ui/Boton'
import { Marca } from '@/shared/ui/Marca'
import { Avisos } from '@/shared/ui/Aviso'
import { EncabezadoSimple } from '@/shared/ui/EncabezadoSimple'
import { PaginaCentrada } from '@/shared/ui/PaginaCentrada'
import { PieDePagina } from '@/shared/ui/PieDePagina'
import { TextoSuave } from '@/shared/ui/TextoSuave'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './ModeSelectionPage.module.css'
import type { WorkMode } from '@/shared/types/app'

type ModeSelectionPageProps = {
  welcomeName: string
  isDebugAdmin: boolean
  busy: boolean
  error: string
  notice: string
  onChooseMode: (mode: WorkMode) => void
  onSignOut: () => void
}

export function ModeSelectionPage({
  welcomeName,
  isDebugAdmin,
  busy,
  error,
  notice,
  onChooseMode,
  onSignOut,
}: ModeSelectionPageProps) {
  const [taps, setTaps] = useState(0)
  const adminUnlocked = isDebugAdmin && taps >= 5

  return (
    <PaginaCentrada arriba>
      <EncabezadoSimple>
        <Marca soloIcono />
      </EncabezadoSimple>
      <section className={estilos.contenido}>
        <p className={estilos.saludo} onClick={() => setTaps((count) => count + 1)}>
          Bienvenido {welcomeName}
        </p>
        <h1>¿Qué necesitás hacer?</h1>
        <TextoSuave className={estilos.introduccion}>
          Después podés elegir un trabajo para continuar.
        </TextoSuave>
        <Avisos error={error} aviso={notice} />
        <div className={estilos.tarjetas}>
          <button
            className={unirClases(estilos.tarjeta, estilos.carrero)}
            type="button"
            onClick={() => onChooseMode('carrero')}
          >
            <strong>Carrero</strong>
            <span>Abro destinos y cargo las descargas.</span>
          </button>
          <button
            className={unirClases(estilos.tarjeta, estilos.observador)}
            type="button"
            onClick={() => onChooseMode('observador')}
          >
            <strong>Observador</strong>
            <span>Solo veo los kilos y el historial.</span>
          </button>
          {adminUnlocked && (
            <button
              className={unirClases(estilos.tarjeta, estilos.prueba)}
              type="button"
              onClick={() => onChooseMode('admin')}
            >
              <strong>Admin de prueba</strong>
              <span>Puedo alternar entre observador y carrero.</span>
            </button>
          )}
        </div>
      </section>
      <PieDePagina alFinal>
        <Boton
          variante="silenciosa" tamano="chico"
          type="button"
          disabled={busy}
          onClick={onSignOut}
        >
          Cerrar sesión
        </Boton>
      </PieDePagina>
    </PaginaCentrada>
  )
}
