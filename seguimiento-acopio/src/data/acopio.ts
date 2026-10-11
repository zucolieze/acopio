import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  DestinationType,
  MemberRole,
} from '../lib/database.types'

type Client = SupabaseClient<Database>

export type Membership = {
  groupId: string
  groupName: string
  inviteCode: string
  role: MemberRole
}

export type Destination = Database['public']['Tables']['destinations']['Row']
export type Load = Database['public']['Tables']['loads']['Row']

export async function fetchMemberships(
  client: Client,
  userId: string,
): Promise<Membership[]> {
  const { data: memberRows, error: membersError } = await client
    .from('members')
    .select('group_id, role')
    .eq('user_id', userId)

  if (membersError) throw membersError
  if (memberRows.length === 0) return []

  const { data: groups, error: groupsError } = await client
    .from('groups')
    .select('id, name, invite_code')
    .in(
      'id',
      memberRows.map((member) => member.group_id),
    )

  if (groupsError) throw groupsError

  const groupsById = new Map(groups.map((group) => [group.id, group]))

  return memberRows.flatMap((member) => {
    const group = groupsById.get(member.group_id)
    return group
      ? [
          {
            groupId: group.id,
            groupName: group.name,
            inviteCode: group.invite_code,
            role: member.role,
          },
        ]
      : []
  })
}

export async function fetchGroupActivity(
  client: Client,
  groupId: string,
): Promise<{
  destinations: Destination[]
  loads: Load[]
  profileNames: Record<string, string>
}> {
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
    .in(
      'destination_id',
      destinations.map((destination) => destination.id),
    )
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

export async function createGroup(
  client: Client,
  name: string,
  role: MemberRole,
) {
  const { error } = await client.rpc('create_group', {
    p_name: name,
    p_role: role,
  })

  if (error) throw error
}

export async function joinGroup(
  client: Client,
  inviteCode: string,
  role: MemberRole,
) {
  const { error } = await client.rpc('join_group', {
    p_invite_code: inviteCode,
    p_role: role,
  })

  if (error) throw error
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
