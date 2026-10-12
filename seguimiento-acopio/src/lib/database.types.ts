export type MemberRole = 'proveedor' | 'cliente' | 'admin'
export type DestinationType = 'camion' | 'silo' | 'silobolsa'
export type DestinationStatus = 'activo' | 'cerrado'

type TableDefinition<
  Row,
  Required extends keyof Row = never,
  InsertOverrides extends Partial<Row> = {},
> = {
  Row: Row
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>> & InsertOverrides
  Update: Partial<Row>
  Relationships: []
}

type Profile = {
  id: string
  full_name: string | null
  updated_at: string
}

type Group = {
  id: string
  name: string
  invite_code: string
  created_by: string | null
  created_at: string
}

type Member = {
  id: string
  group_id: string
  user_id: string
  role: MemberRole
  created_at: string
}

type Destination = {
  id: string
  group_id: string
  destination_type: DestinationType
  name: string
  status: DestinationStatus
  created_by: string | null
  created_at: string
  closed_at: string | null
}

type Load = {
  id: string
  destination_id: string
  date: string
  kg: number
  created_by: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<Profile, 'id'>
      groups: TableDefinition<Group, 'name'>
      members: TableDefinition<Member, 'group_id' | 'user_id' | 'role'>
      destinations: TableDefinition<
        Destination,
        'group_id' | 'destination_type' | 'name',
        { created_by: string }
      >
      loads: TableDefinition<
        Load,
        'destination_id' | 'kg',
        { created_by: string }
      >
    }
    Views: Record<string, never>
    Functions: {
      create_group: {
        Args: { p_name: string; p_role?: MemberRole }
        Returns: string
      }
      join_group: {
        Args: { p_invite_code: string; p_role: MemberRole }
        Returns: string
      }
    }
    Enums: {
      member_role: MemberRole
      destination_type: DestinationType
      destination_status: DestinationStatus
    }
    CompositeTypes: Record<string, never>
  }
}
