import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, MemberRole } from '../../../lib/database.types'
import type { Membership } from '../types'

type Client = SupabaseClient<Database>

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
    .select('id, name, invite_code, deleted_at')
    .in('id', memberRows.map((member) => member.group_id))

  if (groupsError) throw groupsError

  const groupsById = new Map(groups.map((group) => [group.id, group]))
  return memberRows.flatMap((member) => {
    const group = groupsById.get(member.group_id)
    return group && group.deleted_at === null
      ? [{
          groupId: group.id,
          groupName: group.name,
          inviteCode: group.invite_code,
          role: member.role,
        }]
      : []
  })
}

export async function createGroup(
  client: Client,
  name: string,
  role: MemberRole,
) {
  const { data, error } = await client.rpc('create_group', {
    p_name: name,
    p_role: role,
  })

  if (error) throw error
  if (!data) throw new Error('No se pudo crear el trabajo.')
  return data
}

export async function joinGroup(
  client: Client,
  inviteCode: string,
  role: MemberRole,
) {
  const { data, error } = await client.rpc('join_group', {
    p_invite_code: inviteCode,
    p_role: role,
  })

  if (error) throw error
  if (!data) throw new Error('No se pudo ingresar al trabajo.')
  return data
}

export async function updateGroup(
  client: Client,
  groupId: string,
  name: string,
) {
  const { data, error } = await client
    .from('groups')
    .update({ name })
    .eq('id', groupId)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No se encontró el trabajo o no tenés permiso para editarlo.')
}

export async function softDeleteGroup(client: Client, groupId: string) {
  const { data, error } = await client
    .from('groups')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', groupId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('No se encontró el trabajo o ya fue eliminado.')
}
