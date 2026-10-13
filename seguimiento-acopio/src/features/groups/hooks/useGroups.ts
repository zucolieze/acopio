import { useCallback, useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, MemberRole } from '../../../lib/database.types'
import { messageFromError } from '../../../utils/errors'
import {
  createGroup as createGroupInRepository,
  fetchMemberships,
  joinGroup as joinGroupInRepository,
} from '../model/groupsRepository'
import type { Membership } from '../types'

type Client = SupabaseClient<Database>

export function useGroups(client: Client | null, userId: string | undefined) {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    if (!client || !userId) {
      setMemberships([])
      return []
    }
    setLoading(true)
    try {
      const nextMemberships = await fetchMemberships(client, userId)
      setMemberships(nextMemberships)
      setError('')
      return nextMemberships
    } catch (loadError) {
      setError(messageFromError(loadError))
      throw loadError
    } finally {
      setLoading(false)
    }
  }, [client, userId])

  useEffect(() => {
    setError('')
    setNotice('')
    void refresh().catch(() => undefined)
  }, [refresh])

  const create = useCallback(
    async (name: string, role: MemberRole) => {
      if (!client) throw new Error('No se pudo conectar con la base de datos.')
      setBusy(true)
      setError('')
      setNotice('')
      try {
        const groupId = await createGroupInRepository(client, name, role)
        await refresh()
        setNotice('Trabajo creado. Ya podés compartir el código de invitación.')
        return groupId
      } catch (createError) {
        setError(messageFromError(createError))
        return null
      } finally {
        setBusy(false)
      }
    },
    [client, refresh],
  )

  const join = useCallback(
    async (inviteCode: string, role: MemberRole) => {
      if (!client) throw new Error('No se pudo conectar con la base de datos.')
      setBusy(true)
      setError('')
      setNotice('')
      try {
        const groupId = await joinGroupInRepository(client, inviteCode, role)
        await refresh()
        setNotice('Te sumaste al trabajo.')
        return groupId
      } catch (joinError) {
        setError(messageFromError(joinError))
        return null
      } finally {
        setBusy(false)
      }
    },
    [client, refresh],
  )

  return {
    memberships,
    loading,
    busy,
    error,
    setError,
    notice,
    setNotice,
    refresh,
    create,
    join,
  }
}
