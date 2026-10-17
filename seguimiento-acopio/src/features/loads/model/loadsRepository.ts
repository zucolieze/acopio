import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, DestinationType } from '../../../lib/database.types'
import type {
  ChangeAudit,
  Destination,
  DestinationChanges,
  GroupActivity,
  Load,
  Lot,
} from '../types'

type Client = SupabaseClient<Database>

export async function fetchGroupActivity(
  client: Client,
  groupId: string,
): Promise<GroupActivity> {
  const [destinationsResult, fieldsResult, auditResult] = await Promise.all([
    client
      .from('destinations')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false }),
    client.from('fields').select('id').eq('group_id', groupId),
    client
      .from('change_audit')
      .select('*')
      .eq('group_id', groupId)
      .order('occurred_at', { ascending: false })
      .limit(100),
  ])

  if (destinationsResult.error) throw destinationsResult.error
  if (fieldsResult.error) throw fieldsResult.error
  if (auditResult.error) throw auditResult.error

  const fieldIds = fieldsResult.data.map((field) => field.id)
  let lots: Lot[] = []
  if (fieldIds.length > 0) {
    const { data, error } = await client
      .from('lots')
      .select('*')
      .in('field_id', fieldIds)
      .order('created_at', { ascending: true })
    if (error) throw error
    lots = data
  }

  const destinations = destinationsResult.data
  let loads: Load[] = []
  if (destinations.length > 0) {
    const { data, error } = await client
      .from('loads')
      .select('*')
      .in('destination_id', destinations.map((destination) => destination.id))
      .order('date', { ascending: false })
    if (error) throw error
    loads = data.filter((load) => load.deleted_at === null)
  }

  const audits = auditResult.data
  const userIds = [
    ...new Set(
      [
        ...loads.map((load) => load.created_by),
        ...destinations.map((destination) => destination.created_by),
        ...audits.map((entry) => entry.actor_id),
      ].filter((userId): userId is string => userId !== null),
    ),
  ]

  let profileNames: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles, error } = await client
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
    if (error) throw error
    profileNames = Object.fromEntries(
      profiles.map((profile) => [
        profile.id,
        profile.full_name?.trim() || 'Integrante del grupo',
      ]),
    )
  }

  return {
    destinations,
    loads,
    lots,
    audits,
    profileNames,
  }
}

export async function createLot(client: Client, fieldId: string, name: string) {
  const { data, error } = await client
    .from('lots')
    .insert({ field_id: fieldId, name })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateLot(client: Client, lotId: string, name: string) {
  const { data, error } = await client
    .from('lots')
    .update({ name })
    .eq('id', lotId)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No se encontró el lote o no tenés permiso para editarlo.')
}

export async function softDeleteLot(client: Client, lotId: string) {
  const { data, error } = await client
    .from('lots')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', lotId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No se encontró el lote o ya fue eliminado.')
}

export async function createDestination(
  client: Client,
  groupId: string,
  userId: string,
  lotId: string,
  destinationType: DestinationType,
  name: string,
  capacityKg: number | null,
  openingHumidity: number | null,
) {
  const { error } = await client.from('destinations').insert({
    group_id: groupId,
    created_by: userId,
    lot_id: lotId,
    destination_type: destinationType,
    name,
    capacity_kg: capacityKg,
    opening_humidity: openingHumidity,
    opening_humidity_at: openingHumidity === null ? null : new Date().toISOString(),
  })
  if (error) throw error
}

export async function addLoad(
  client: Client,
  destinationId: string,
  userId: string,
  kg: number,
) {
  const { error } = await client.from('loads').insert({
    destination_id: destinationId,
    created_by: userId,
    kg,
  })
  if (error) throw error
}

export async function closeDestination(
  client: Client,
  destinationId: string,
  closingHumidity: number | null,
) {
  const closingHumidityAt = closingHumidity === null ? null : new Date().toISOString()
  const { data, error } = await client
    .from('destinations')
    .update({
      status: 'cerrado',
      closed_at: new Date().toISOString(),
      closing_humidity: closingHumidity,
      closing_humidity_at: closingHumidityAt,
    })
    .eq('id', destinationId)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No se encontró el destino o ya fue cerrado.')
}

export async function updateDestination(
  client: Client,
  destinationId: string,
  changes: DestinationChanges,
) {
  const { data, error } = await client
    .from('destinations')
    .update(changes)
    .eq('id', destinationId)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No se encontró el destino o no tenés permiso para editarlo.')
}

export async function softDeleteDestination(client: Client, destinationId: string) {
  const { data, error } = await client
    .from('destinations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', destinationId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No se encontró el destino o ya fue eliminado.')
}

export async function updateLoad(
  client: Client,
  loadId: string,
  kg: number,
  date: string,
) {
  const { data, error } = await client
    .from('loads')
    .update({ kg, date })
    .eq('id', loadId)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No se encontró la pesada o no tenés permiso para editarla.')
}

export async function softDeleteLoad(client: Client, loadId: string) {
  const { data, error } = await client
    .from('loads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', loadId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No se encontró la pesada o ya fue eliminada.')
}

export type { ChangeAudit, Destination, Load, Lot }
