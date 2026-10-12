import type { MemberRole } from '../../lib/database.types'

export type Membership = {
  groupId: string
  groupName: string
  inviteCode: string
  role: MemberRole
}

export type WorkMenuAction = 'crear' | 'elegir' | 'sumarme' | null
