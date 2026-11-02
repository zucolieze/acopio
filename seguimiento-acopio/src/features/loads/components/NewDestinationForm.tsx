import type { FormEvent } from 'react'
import type { DestinationType } from '../../../lib/database.types'
import { destinationLabels } from '../types'

type NewDestinationFormProps = {
  destinationType: DestinationType
  destinationName: string
  truckCapacity: string
  openingHumidity: string
  busy: boolean
  loading: boolean
  canOpen: boolean
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
    <section className="new-destination panel">
      <p className="eyebrow">Abrir destino</p>
      <h2>¿Dónde se van a juntar los kilos?</h2>
      <p className="muted">Elegí un tipo y poné un nombre para reconocerlo.</p>
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="destination-types" role="group" aria-label="Tipo de destino">
          {(Object.keys(destinationLabels) as DestinationType[]).map((type) => (
            <button
              key={type}
              className={destinationType === type ? 'type-choice is-selected' : 'type-choice'}
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
            maxLength={destinationType === 'camion' ? 7 : 120}
            minLength={destinationType === 'camion' ? 6 : undefined}
            pattern={
              destinationType === 'camion'
                ? '(?:[A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})'
                : undefined
            }
            placeholder={placeholder}
            required
            value={destinationName}
            onChange={(event) =>
              onDestinationNameChange(
                destinationType === 'camion'
                  ? event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
                  : event.target.value,
              )
            }
          />
          {destinationType === 'camion' && (
            <span className="muted small-copy">Sin espacios. Formato: ABC123 o AA123BB.</span>
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
              inputMode="decimal"
              max="100"
              min="0"
              placeholder="Ej.: 14.5"
              required
              step="0.01"
              type="number"
              value={openingHumidity}
              onChange={(event) => onOpeningHumidityChange(event.target.value)}
            />
          </label>
        )}
        <button className="button button--primary button--large" disabled={busy || loading || !canOpen}>
          {busy ? 'Abriendo destino…' : loading ? 'Cargando trabajo…' : !canOpen ? 'Elegí un lote primero' : 'Abrir destino'}
        </button>
      </form>
    </section>
  )
}
