import { useState } from 'react'
import { cerealOptions } from '../types'
import type { Lot } from '../types'

type LotCerealEditorProps = {
  lot: Lot
  busy: boolean
  onSave: (lot: Lot, cereal: string) => void
}

export function LotCerealEditor({ lot, busy, onSave }: LotCerealEditorProps) {
  const [cereal, setCereal] = useState(lot.cereal ?? '')

  return (
    <form
      className="cereal-editor"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(lot, cereal)
      }}
    >
      <label>
        Cereal del lote
        <select value={cereal} onChange={(event) => setCereal(event.target.value)}>
          {!lot.cereal && <option value="">Sin cereal</option>}
          {cerealOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
      <button
        className="button button--secondary button--small"
        type="submit"
        disabled={busy || !cereal || cereal === (lot.cereal ?? '')}
      >
        Guardar cereal
      </button>
    </form>
  )
}
