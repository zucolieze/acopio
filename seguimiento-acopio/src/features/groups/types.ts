import type { MemberRole } from '../../lib/database.types'

export type Membership = {
  groupId: string
  groupName: string
  /** Mes y año de creación; se agrega solo al nombre que se muestra. */
  period: string
  inviteCode: string
  role: MemberRole
}

export function workLabel(membership: Pick<Membership, 'groupName' | 'period'>) {
  return `${membership.groupName} · ${membership.period}`
}

export type WorkMenuAction = 'crear' | 'elegir' | 'sumarme' | null
