import type { Database, DestinationType } from '../../lib/database.types'

export type Destination = Database['public']['Tables']['destinations']['Row']
export type Load = Database['public']['Tables']['loads']['Row']
export type Lot = Database['public']['Tables']['lots']['Row']
export type Field = Database['public']['Tables']['fields']['Row']
export type WorkMember = {
  userId: string
  role: Database['public']['Tables']['members']['Row']['role']
  fullName: string
}
export type ChangeAudit = Database['public']['Tables']['change_audit']['Row']
export type DestinationChanges = Partial<
  Pick<
    Destination,
    | 'lot_id'
    | 'destination_type'
    | 'name'
    | 'capacity_kg'
    | 'opening_humidity'
    | 'opening_humidity_at'
    | 'closing_humidity'
    | 'closing_humidity_at'
    | 'closed_at'
  >
>
export type LotChanges = { cereal?: string; hectares?: number | null }
export type Tab = 'activos' | 'nuevo' | 'historial' | 'lotes' | 'info'

export type GroupActivity = {
  destinations: Destination[]
  loads: Load[]
  fields: Field[]
  lots: Lot[]
  /** Lotes y campos de otros trabajos que aparecen en descargas de estos destinos. */
  foreignLots: Lot[]
  foreignFields: Field[]
  seasonId: string | null
  workMembers: WorkMember[]
  audits: ChangeAudit[]
  profileNames: Record<string, string>
}

export const cerealOptions = [
  'Soja',
  'Maíz',
  'Trigo',
  'Girasol',
  'Sorgo',
  'Cebada',
  'Otro',
]

export const destinationLabels: Record<DestinationType, string> = {
  camion: 'Camión',
  silo: 'Silo',
  silobolsa: 'Silobolsa',
}
