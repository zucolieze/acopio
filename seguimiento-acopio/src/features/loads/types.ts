import type { Database, DestinationType } from '../../lib/database.types'

export type Destination = Database['public']['Tables']['destinations']['Row']
export type Load = Database['public']['Tables']['loads']['Row']
export type Lot = Database['public']['Tables']['lots']['Row']
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
export type Tab = 'activos' | 'nuevo' | 'historial'

export type GroupActivity = {
  destinations: Destination[]
  loads: Load[]
  lots: Lot[]
  audits: ChangeAudit[]
  profileNames: Record<string, string>
}

export const destinationLabels: Record<DestinationType, string> = {
  camion: 'Camión',
  silo: 'Silo',
  silobolsa: 'Silobolsa',
}
