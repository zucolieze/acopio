import type { Database, DestinationType } from '../../lib/database.types'

export type Destination = Database['public']['Tables']['destinations']['Row']
export type Load = Database['public']['Tables']['loads']['Row']
export type Tab = 'activos' | 'nuevo' | 'historial'

export type GroupActivity = {
  destinations: Destination[]
  loads: Load[]
  profileNames: Record<string, string>
}

export const destinationLabels: Record<DestinationType, string> = {
  camion: 'Camión',
  silo: 'Silo',
  silobolsa: 'Silobolsa',
}
