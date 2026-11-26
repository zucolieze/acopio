import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Boton } from '@/shared/ui/Boton'
import { Panel } from '@/shared/ui/Panel'
import { cerealOptions } from '../types'
import type { Destination, Lot, LotChanges } from '../types'
import { LotManagement } from './LotManagement'
import { TextoSuave } from '@/shared/ui/TextoSuave'
import { unirClases } from '@/shared/utils/unirClases'
import estilos from './WorkStructureManagement.module.css'

type WorkStructureManagementProps = {
  lots: Lot[]
  destinations: Destination[]
  activeLotId: string
  newLotName: string
  newLotCereal: string
  busy: string
  onNewLotNameChange: (value: string) => void
  onNewLotCerealChange: (value: string) => void
  onCreateLot: () => void
  onRenameLot: (lot: Lot, name: string) => void
  onUpdateLot: (lot: Lot, changes: LotChanges) => void
  onDeleteLot: (lot: Lot) => void
}

export function WorkStructureManagement(props: WorkStructureManagementProps) {
  const lots = props.lots.filter((lot) => lot.deleted_at === null)
  const [open, setOpen] = useState(!props.activeLotId)
  const previousLotId = useRef(props.activeLotId)
  const [addOpen, setAddOpen] = useState(false)
  const lotCount = lots.length
  const previousLotCount = useRef(lotCount)

  useEffect(() => {
    if (lotCount > previousLotCount.current) setAddOpen(false)
    previousLotCount.current = lotCount
  }, [lotCount])

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
    <form className={unirClases(estilos.crear, estilos.crearLote)} onSubmit={submitLot}>
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
      <Boton
        variante="primaria"
        type="submit"
        disabled={props.busy === 'lot'}
      >
        {props.busy === 'lot' ? 'Creando…' : 'Crear lote'}
      </Boton>
    </form>
  )

  const summary = lots.length > 0 ? `Lotes del campo (${lots.length})` : 'Creá el primer lote'

  return (
    <Panel
      como="details"
      className={estilos.estructura}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{summary}</summary>
      <div className={estilos.contenido}>
        {lots.length === 0 && (
          <>
            <TextoSuave>
              Para abrir un destino primero necesitás un lote. Poné su nombre y qué
              cereal tiene.
            </TextoSuave>
            {lotForm('Nombre del lote')}
          </>
        )}

        {lots.length > 0 && (
          <>
            <details
              className={estilos.otroLote}
              open={addOpen}
              onToggle={(event) => setAddOpen(event.currentTarget.open)}
            >
              <summary>Agregar otro lote</summary>
              {lotForm('Nombre del lote')}
            </details>
            <LotManagement
              className={estilos.administracion}
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
    </Panel>
  )
}
