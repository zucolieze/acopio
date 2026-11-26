import type { FormEvent } from 'react'
import { Boton } from '@/shared/ui/Boton'
import { Panel } from '@/shared/ui/Panel'
import type { DestinationType } from '@/shared/lib/database.types'
import { destinationLabels } from '../types'
import { normalizePlate } from '@/shared/utils/plates'
import {
  formatHumidityInput,
  HUMIDITY_ERROR,
  HUMIDITY_PATTERN,
} from '@/shared/utils/humidity'
import { unirClases } from '@/shared/utils/unirClases'
import { FormularioApilado } from '@/shared/ui/FormularioApilado'
import { TextoSuave } from '@/shared/ui/TextoSuave'
import estilos from './NewDestinationForm.module.css'

type NewDestinationFormProps = {
  destinationType: DestinationType
  destinationName: string
  truckCapacity: string
  openingHumidity: string
  busy: boolean
  loading: boolean
  canOpen: boolean
  lotLabel: string
  onDestinationTypeChange: (type: DestinationType) => void
  onDestinationNameChange: (name: string) => void
  onTruckCapacityChange: (value: string) => void
  onOpeningHumidityChange: (value: string) => void
  onSubmit: (
    type: DestinationType,
    name: string,
    capacity: string,
    humidity: string,
  ) => void
}

export function NewDestinationForm({
  destinationType,
  destinationName,
  truckCapacity,
  openingHumidity,
  busy,
  loading,
  canOpen,
  lotLabel,
  onDestinationTypeChange,
  onDestinationNameChange,
  onTruckCapacityChange,
  onOpeningHumidityChange,
  onSubmit,
}: NewDestinationFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(destinationType, destinationName.trim(), truckCapacity, openingHumidity)
  }

  const placeholder =
    destinationType === 'camion'
      ? 'ABC123 o AA123BB'
      : destinationType === 'silo'
        ? 'Ej.: Silo 3'
        : 'Ej.: Bolsa 12'

  return (
    <Panel className={estilos.nuevo}>
      <p className={estilos.lote}>
        {lotLabel ? <>Lote: <strong>{lotLabel}</strong></> : 'Primero creá el campo y el lote acá abajo.'}
      </p>
      <FormularioApilado className={estilos.formulario} onSubmit={handleSubmit}>
        <div className={estilos.tipos} role="group" aria-label="Tipo de destino">
          {(Object.keys(destinationLabels) as DestinationType[]).map((type) => (
            <button
              key={type}
              className={unirClases(estilos.tipo, destinationType === type && estilos.elegido)}
              type="button"
              aria-pressed={destinationType === type}
              onClick={() => onDestinationTypeChange(type)}
            >
              {destinationLabels[type]}
            </button>
          ))}
        </div>
        <label>
          {destinationType === 'camion' ? 'Patente' : 'Nombre o número'}
          <input
            autoCapitalize={destinationType === 'camion' ? 'characters' : undefined}
            autoComplete="off"
            maxLength={destinationType === 'camion' ? 10 : 120}
            minLength={destinationType === 'camion' ? 4 : undefined}
            placeholder={placeholder}
            required
            value={destinationName}
            onChange={(event) =>
              onDestinationNameChange(
                destinationType === 'camion'
                  ? normalizePlate(event.target.value)
                  : event.target.value,
              )
            }
          />
          {destinationType === 'camion' && (
            <TextoSuave como="span" chico className={estilos.ayuda}>Formato sugerido: ABC123 o AA123BB. Si es de otro país, escribila como figura.</TextoSuave>
          )}
        </label>
        {destinationType === 'camion' && (
          <label>
            Límite de carga (kg)
            <input
              inputMode="decimal"
              min="0.01"
              placeholder="Ej.: 30000"
              required
              step="0.01"
              type="number"
              value={truckCapacity}
              onChange={(event) => onTruckCapacityChange(event.target.value)}
            />
          </label>
        )}
        {destinationType !== 'camion' && (
          <label>
            Humedad inicial (%)
            <input
              autoComplete="off"
              inputMode="decimal"
              maxLength={4}
              pattern={HUMIDITY_PATTERN}
              placeholder="Ej.: 14.5"
              required
              title={HUMIDITY_ERROR}
              type="text"
              value={openingHumidity}
              onChange={(event) => onOpeningHumidityChange(formatHumidityInput(event.target.value))}
            />
          </label>
        )}
        <Boton variante="primaria" tamano="grande" disabled={busy || loading || !canOpen}>
          {busy ? 'Abriendo destino…' : loading ? 'Cargando trabajo…' : !canOpen ? 'Elegí un lote primero' : 'Abrir destino'}
        </Boton>
      </FormularioApilado>
    </Panel>
  )
}
