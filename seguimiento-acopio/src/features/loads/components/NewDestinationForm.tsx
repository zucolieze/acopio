import type { FormEvent } from 'react'
import type { DestinationType } from '../../../lib/database.types'
import { destinationLabels } from '../types'

type NewDestinationFormProps = {
  destinationType: DestinationType
  destinationName: string
  busy: boolean
  onDestinationTypeChange: (type: DestinationType) => void
  onDestinationNameChange: (name: string) => void
  onSubmit: (type: DestinationType, name: string) => void
}

export function NewDestinationForm({
  destinationType,
  destinationName,
  busy,
  onDestinationTypeChange,
  onDestinationNameChange,
  onSubmit,
}: NewDestinationFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(destinationType, destinationName.trim())
  }

  const placeholder =
    destinationType === 'camion'
      ? 'Ej.: Camión 1'
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
          Nombre o número
          <input
            autoComplete="off"
            maxLength={120}
            placeholder={placeholder}
            required
            value={destinationName}
            onChange={(event) => onDestinationNameChange(event.target.value)}
          />
        </label>
        <button className="button button--primary button--large" disabled={busy}>
          {busy ? 'Abriendo destino…' : 'Abrir destino'}
        </button>
      </form>
    </section>
  )
}
