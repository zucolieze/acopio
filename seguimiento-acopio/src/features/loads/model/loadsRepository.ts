import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, DestinationType } from '../../../lib/database.types'
import type { Destination, GroupActivity, Load } from '../types'

type Client = SupabaseClient<Database>

export async function fetchGroupActivity(
  client: Client,
  groupId: string,
): Promise<GroupActivity> {
  const { data: destinations, error: destinationsError } = await client
    .from('destinations')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (destinationsError) throw destinationsError
  if (destinations.length === 0) {
    return { destinations, loads: [], profileNames: {} }
  }

  const { data: loads, error: loadsError } = await client
    .from('loads')
    .select('*')
    .in('destination_id', destinations.map((destination) => destination.id))
    .order('date', { ascending: false })

  if (loadsError) throw loadsError

  const userIds = [
    ...new Set(
      loads
        .map((load) => load.created_by)
        .filter((userId): userId is string => userId !== null),
    ),
  ]
  if (userIds.length === 0) return { destinations, loads, profileNames: {} }

  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  if (profilesError) throw profilesError

  return {
    destinations,
    loads,
    profileNames: Object.fromEntries(
      profiles.map((profile) => [
        profile.id,
        profile.full_name?.trim() || 'Integrante del grupo',
      ]),
    ),
  }
}

export async function createDestination(
  client: Client,
  groupId: string,
  userId: string,
  destinationType: DestinationType,
  name: string,
) {
  const { error } = await client.from('destinations').insert({
    group_id: groupId,
    created_by: userId,
    destination_type: destinationType,
    name,
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
) {
  const { error } = await client
    .from('destinations')
    .update({ status: 'cerrado', closed_at: new Date().toISOString() })
    .eq('id', destinationId)
  if (error) throw error
}

export type { Destination, Load }
