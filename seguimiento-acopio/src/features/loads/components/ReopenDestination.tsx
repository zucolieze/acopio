import { useState } from 'react'
import { Boton } from '@/shared/ui/Boton'
import {
  formatHumidityInput,
  HUMIDITY_ERROR,
  HUMIDITY_PATTERN,
  parseHumidity,
} from '@/shared/utils/humidity'
import type { Destination } from '../types'
import { TextoSuave } from '@/shared/ui/TextoSuave'
import estilos from './ReopenDestination.module.css'

type ReopenDestinationProps = {
  destination: Destination
  busy: boolean
  onReopen: (destination: Destination, openingHumidity: number | null) => void
}

// Reactivar un destino cerrado: vuelve a Activos como un destino nuevo. Los
// silos y silobolsas piden una humedad inicial nueva; las anteriores se guardan.
export function ReopenDestination({ destination, busy, onReopen }: ReopenDestinationProps) {
  const [open, setOpen] = useState(false)
  const [humidity, setHumidity] = useState('')
  const needsHumidity = destination.destination_type !== 'camion'
  const parsed = parseHumidity(humidity)

  if (!open) {
    return (
      <Boton
        variante="secundaria" className={estilos.reactivar}
        type="button"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Reactivar destino
      </Boton>
    )
  }

  return (
    <form
      className={estilos.formulario}
      onSubmit={(event) => {
        event.preventDefault()
        if (needsHumidity && parsed === null) return
        onReopen(destination, needsHumidity ? parsed : null)
        setOpen(false)
        setHumidity('')
      }}
    >
      <TextoSuave chico>
        {needsHumidity
          ? 'El destino vuelve a Activos como uno nuevo. Cargá la humedad inicial de esta nueva etapa; las humedades anteriores se conservan para el promedio.'
          : 'El camión vuelve a Activos como un destino nuevo.'}
      </TextoSuave>
      {needsHumidity && (
        <label>
          Humedad inicial nueva (%)
          <input
            autoComplete="off"
            inputMode="decimal"
            maxLength={4}
            pattern={HUMIDITY_PATTERN}
            placeholder="Ej.: 14.5"
            required
            title={HUMIDITY_ERROR}
            type="text"
            value={humidity}
            onChange={(event) => setHumidity(formatHumidityInput(event.target.value))}
          />
        </label>
      )}
      <div className={estilos.acciones}>
        <Boton
          variante="primaria"
          type="submit"
          disabled={busy || (needsHumidity && parsed === null)}
        >
          {busy ? 'Reactivando…' : 'Reactivar'}
        </Boton>
        <Boton variante="enlace" type="button" onClick={() => setOpen(false)}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}
