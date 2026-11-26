import { useState } from 'react'
import type { FormEvent } from 'react'
import { Boton } from '@/shared/ui/Boton'
import { cerealOptions } from '../types'
import type { Destination, Lot, LotChanges } from '../types'
import { unirClases } from '@/shared/utils/unirClases'
import { FilaAcciones } from './FilaAcciones'
import { TextoSuave } from '@/shared/ui/TextoSuave'
import estilos from './LotManagement.module.css'

type LotManagementProps = {
  className?: string
  lots: Lot[]
  destinations: Destination[]
  busy: string
  onRename: (lot: Lot, name: string) => void
  onUpdate: (lot: Lot, changes: LotChanges) => void
  onDelete: (lot: Lot) => void
}

export function LotManagement({
  className,
  lots,
  destinations,
  busy,
  onRename,
  onUpdate,
  onDelete,
}: LotManagementProps) {
  if (lots.length === 0) return null

  return (
    <details className={unirClases(estilos.lotes, className)}>
      <summary>Administrar lotes</summary>
      <ul>
        {lots.map((lot) => (
          <LotRow
            key={lot.id}
            lot={lot}
            hasActiveDestinations={destinations.some(
              (destination) =>
                destination.lot_id === lot.id &&
                destination.status === 'activo' &&
                destination.deleted_at === null,
            )}
            isLastActiveLot={lots.length === 1}
            busy={busy === lot.id}
            onRename={onRename}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </details>
  )
}

function LotRow({
  lot,
  hasActiveDestinations,
  isLastActiveLot,
  busy,
  onRename,
  onUpdate,
  onDelete,
}: {
  lot: Lot
  hasActiveDestinations: boolean
  isLastActiveLot: boolean
  busy: boolean
  onRename: LotManagementProps['onRename']
  onUpdate: LotManagementProps['onUpdate']
  onDelete: LotManagementProps['onDelete']
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(lot.name)
  const [cereal, setCereal] = useState(lot.cereal ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim() !== lot.name) onRename(lot, name)
    if (cereal && cereal !== lot.cereal) onUpdate(lot, { cereal })
    setEditing(false)
  }

  return (
    <li>
      {editing ? (
        <form className={estilos.edicion} onSubmit={submit}>
          <input
            maxLength={120}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label={`Nombre del lote ${lot.name}`}
          />
          <select
            value={cereal}
            aria-label="Cereal del lote"
            onChange={(event) => setCereal(event.target.value)}
          >
            {!lot.cereal && <option value="">Sin cereal</option>}
            {cerealOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <Boton variante="secundaria" tamano="chico" type="submit" disabled={busy}>
            Guardar
          </Boton>
        </form>
      ) : (
        <>
          <span>
            {lot.name}
            {lot.cereal ? ` · ${lot.cereal}` : ''}
            {lot.hectares ? ` · ${lot.hectares} ha` : ''}
          </span>
          <FilaAcciones>
            <Boton
              variante="enlace"
              type="button"
              disabled={busy}
              onClick={() => {
                setName(lot.name)
                setCereal(lot.cereal ?? '')
                setEditing(true)
              }}
            >
              Editar
            </Boton>
            <Boton
              variante="enlacePeligro"
              type="button"
              disabled={busy || hasActiveDestinations || isLastActiveLot}
              title={
                hasActiveDestinations
                  ? 'Cerrá o eliminá los destinos activos antes de eliminar el lote.'
                  : isLastActiveLot
                    ? 'El trabajo debe conservar al menos un lote activo.'
                  : undefined
              }
              onClick={() => onDelete(lot)}
            >
              Eliminar
            </Boton>
          </FilaAcciones>
        </>
      )}
      {hasActiveDestinations && (
        <TextoSuave chico>Tiene destinos activos; no se puede eliminar todavía.</TextoSuave>
      )}
      {isLastActiveLot && (
        <TextoSuave chico>El trabajo debe conservar al menos un lote activo.</TextoSuave>
      )}
    </li>
  )
}
