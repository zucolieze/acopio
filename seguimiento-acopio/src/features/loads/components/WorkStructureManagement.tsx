import { useState, type FormEvent } from 'react'
import type { Destination, Field, Lot } from '../types'
import { LotManagement } from './LotManagement'

type WorkStructureManagementProps = {
  fields: Field[]
  lots: Lot[]
  destinations: Destination[]
  activeFieldId: string
  activeLotId: string
  newFieldName: string
  newLotName: string
  busy: string
  hasAnyDestinations: boolean
  onFieldChange: (fieldId: string) => void
  onLotChange: (lotId: string) => void
  onNewFieldNameChange: (value: string) => void
  onNewLotNameChange: (value: string) => void
  onCreateField: () => void
  onCreateLot: () => void
  onRenameField: (field: Field, name: string) => void
  onRenameLot: (lot: Lot, name: string) => void
  onDeleteLot: (lot: Lot) => void
}

export function WorkStructureManagement(props: WorkStructureManagementProps) {
  const activeFields = props.fields
  const activeLots = props.lots.filter(
    (lot) => lot.field_id === props.activeFieldId && lot.deleted_at === null,
  )
  const selectedField = activeFields.find((field) => field.id === props.activeFieldId)

  function submitField(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    props.onCreateField()
  }

  function submitLot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    props.onCreateLot()
  }

  return (
    <details className="work-structure panel" open={!props.hasAnyDestinations}>
      <summary>{props.hasAnyDestinations ? 'Campos y lotes' : 'Elegí el campo y lote de trabajo'}</summary>
      <div className="work-structure__content">
        {activeFields.length > 0 && (
          <label>
            Campo para nuevos destinos
            <select
              value={props.activeFieldId}
              onChange={(event) => props.onFieldChange(event.target.value)}
            >
              {activeFields.map((field) => (
                <option key={field.id} value={field.id}>{field.name}</option>
              ))}
            </select>
          </label>
        )}
        {activeLots.length > 0 && (
          <label>
            Lote para nuevos destinos
            <select
              value={props.activeLotId}
              onChange={(event) => props.onLotChange(event.target.value)}
            >
              {activeLots.map((lot) => (
                <option key={lot.id} value={lot.id}>{lot.name}</option>
              ))}
            </select>
          </label>
        )}
        {selectedField && (
          <FieldManagement
            fields={activeFields}
            busy={props.busy}
            onRename={props.onRenameField}
          />
        )}
        <form className="create-lot-form" onSubmit={submitField}>
          <label>
            Agregar campo
            <input
              maxLength={120}
              placeholder="Ej.: Campo Norte"
              required
              value={props.newFieldName}
              onChange={(event) => props.onNewFieldNameChange(event.target.value)}
            />
          </label>
          <button
            className="button button--secondary"
            type="submit"
            disabled={props.busy === 'field' || activeFields.length === 0}
          >
            {props.busy === 'field' ? 'Creando…' : 'Crear campo'}
          </button>
        </form>
        <form className="create-lot-form" onSubmit={submitLot}>
          <label>
            Agregar lote{selectedField ? ` en ${selectedField.name}` : ''}
            <input
              maxLength={120}
              placeholder="Ej.: Lote 2"
              required
              value={props.newLotName}
              onChange={(event) => props.onNewLotNameChange(event.target.value)}
            />
          </label>
          <button
            className="button button--secondary"
            type="submit"
            disabled={props.busy === 'lot' || !selectedField}
          >
            {props.busy === 'lot' ? 'Creando…' : 'Crear lote'}
          </button>
        </form>
        {!selectedField && (
          <p className="muted">No hay campos. Creá un campo para empezar.</p>
        )}
        {selectedField && activeLots.length === 0 && (
          <p className="muted">Este campo todavía no tiene lotes.</p>
        )}
        {selectedField && (
          <LotManagement
            lots={activeLots}
            destinations={props.destinations}
            busy={props.busy}
            onRename={props.onRenameLot}
            onDelete={props.onDeleteLot}
          />
        )}
      </div>
    </details>
  )
}

function FieldManagement({
  fields,
  busy,
  onRename,
}: {
  fields: Field[]
  busy: string
  onRename: (field: Field, name: string) => void
}) {
  return (
    <details className="field-management">
      <summary>Editar nombres de campos</summary>
      <ul>
        {fields.map((field) => (
          <FieldRow
            key={field.id}
            field={field}
            busy={busy === field.id}
            onRename={onRename}
          />
        ))}
      </ul>
    </details>
  )
}

function FieldRow({
  field,
  busy,
  onRename,
}: {
  field: Field
  busy: boolean
  onRename: (field: Field, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(field.name)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onRename(field, name)
    setEditing(false)
  }

  return (
    <li>
      {editing ? (
        <form className="lot-management__edit" onSubmit={submit}>
          <input
            maxLength={120}
            required
            value={name}
            aria-label={`Nombre del campo ${field.name}`}
            onChange={(event) => setName(event.target.value)}
          />
          <button
            className="button button--secondary button--small"
            type="submit"
            disabled={busy}
          >
            Guardar
          </button>
        </form>
      ) : (
        <div className="lot-management__actions">
          <span>{field.name}</span>
          <button
            className="link-button"
            type="button"
            disabled={busy}
            onClick={() => {
              setName(field.name)
              setEditing(true)
            }}
          >
            Editar
          </button>
        </div>
      )}
    </li>
  )
}
