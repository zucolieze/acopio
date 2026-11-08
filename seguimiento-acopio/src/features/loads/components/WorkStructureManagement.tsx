import { useEffect, useRef, useState, type FormEvent } from 'react'
import { cerealOptions } from '../types'
import type { Destination, Lot, LotChanges } from '../types'
import { LotManagement } from './LotManagement'

type WorkStructureManagementProps = {
  lots: Lot[]
  destinations: Destination[]
  activeLotId: string
  newLotName: string
  newLotCereal: string
  busy: string
  onLotChange: (lotId: string) => void
  onNewLotNameChange: (value: string) => void
  onNewLotCerealChange: (value: string) => void
  onCreateLot: () => void
  onRenameLot: (lot: Lot, name: string) => void
  onUpdateLot: (lot: Lot, changes: LotChanges) => void
  onDeleteLot: (lot: Lot) => void
}

export function WorkStructureManagement(props: WorkStructureManagementProps) {
  const lots = props.lots.filter((lot) => lot.deleted_at === null)
  const activeLot = lots.find((lot) => lot.id === props.activeLotId)
  const [open, setOpen] = useState(!props.activeLotId)
  const previousLotId = useRef(props.activeLotId)

  useEffect(() => {
    if (!previousLotId.current && props.activeLotId) setOpen(false)
    if (!props.activeLotId) setOpen(true)
    previousLotId.current = props.activeLotId
  }, [props.activeLotId])

  function submitLot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    props.onCreateLot()
  }

  const lotForm = (label: string) => (
    <form className="create-lot-form create-lot-form--lot" onSubmit={submitLot}>
      <label>
        {label}
        <input
          maxLength={120}
          placeholder="Ej.: Lote 1"
          required
          value={props.newLotName}
          onChange={(event) => props.onNewLotNameChange(event.target.value)}
        />
      </label>
      <label>
        Cereal del lote
        <select
          required
          value={props.newLotCereal}
          onChange={(event) => props.onNewLotCerealChange(event.target.value)}
        >
          <option value="">Elegí un cereal</option>
          {cerealOptions.map((cereal) => (
            <option key={cereal} value={cereal}>{cereal}</option>
          ))}
        </select>
      </label>
      <button
        className="button button--primary"
        type="submit"
        disabled={props.busy === 'lot'}
      >
        {props.busy === 'lot' ? 'Creando…' : 'Crear lote'}
      </button>
    </form>
  )

  const summary = activeLot
    ? `Lote de trabajo: ${activeLot.name}${activeLot.cereal ? ` · ${activeLot.cereal}` : ''}`
    : 'Creá el primer lote'

  return (
    <details
      className="work-structure panel"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{summary}</summary>
      <div className="work-structure__content">
        {lots.length === 0 && (
          <>
            <p className="muted">
              Para abrir un destino primero necesitás un lote. Poné su nombre y qué
              cereal tiene.
            </p>
            {lotForm('Nombre del lote')}
          </>
        )}

        {lots.length > 0 && (
          <>
            <label>
              Lote de trabajo
              <select
                value={props.activeLotId}
                onChange={(event) => props.onLotChange(event.target.value)}
              >
                {lots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name}{lot.cereal ? ` · ${lot.cereal}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <details className="field-management">
              <summary>Agregar otro lote</summary>
              {lotForm('Nombre del lote')}
            </details>
            <LotManagement
              lots={lots}
              destinations={props.destinations}
              busy={props.busy}
              onRename={props.onRenameLot}
              onUpdate={props.onUpdateLot}
              onDelete={props.onDeleteLot}
            />
          </>
        )}
      </div>
    </details>
  )
}
