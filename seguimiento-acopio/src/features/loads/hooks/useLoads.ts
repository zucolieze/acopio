import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, DestinationType } from '../../../lib/database.types'
import { messageFromError } from '../../../utils/errors'
import {
  addLoad as addLoadToRepository,
  closeDestination as closeDestinationInRepository,
  createDestination as createDestinationInRepository,
  fetchGroupActivity,
} from '../model/loadsRepository'
import type { Destination, Load, Tab } from '../types'

type Client = SupabaseClient<Database>

export function useLoads(
  client: Client | null,
  groupId: string,
  userId: string | undefined,
) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loads, setLoads] = useState<Load[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<Tab>('activos')
  const [destinationType, setDestinationType] =
    useState<DestinationType>('camion')
  const [destinationName, setDestinationName] = useState('')
  const [loadKilos, setLoadKilos] = useState<Record<string, string>>({})
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [live, setLive] = useState(false)

  const refresh = useCallback(async () => {
    if (!client || !groupId) return
    try {
      const activity = await fetchGroupActivity(client, groupId)
      setDestinations(activity.destinations)
      setLoads(activity.loads)
      setProfileNames(activity.profileNames)
      setError('')
    } catch (refreshError) {
      setError(messageFromError(refreshError))
      throw refreshError
    }
  }, [client, groupId])

  useEffect(() => {
    setDestinations([])
    setLoads([])
    setProfileNames({})
    setTab('activos')
    setError('')
    setNotice('')
    if (!client || !groupId) return
    let mounted = true

    void fetchGroupActivity(client, groupId)
      .then((activity) => {
        if (!mounted) return
        setDestinations(activity.destinations)
        setLoads(activity.loads)
        setProfileNames(activity.profileNames)
      })
      .catch((loadError: unknown) => {
        if (mounted) setError(messageFromError(loadError))
      })

    const channel = client
      .channel(`group-activity-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'destinations',
          filter: `group_id=eq.${groupId}`,
        },
        () => void refresh().catch(() => undefined),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loads' },
        () => void refresh().catch(() => undefined),
      )
      .subscribe((status) => {
        if (mounted) setLive(status === 'SUBSCRIBED')
      })

    return () => {
      mounted = false
      setLive(false)
      void client.removeChannel(channel)
    }
  }, [client, groupId, refresh])

  const create = useCallback(
    async (type: DestinationType, name: string) => {
      if (!client || !userId || !groupId) return
      setBusy('destination')
      setError('')
      setNotice('')
      try {
        await createDestinationInRepository(client, groupId, userId, type, name)
        setDestinationName('')
        setTab('activos')
        setNotice('Destino abierto. Ya podés cargar kilos.')
        await refresh()
      } catch (createError) {
        setError(messageFromError(createError))
      } finally {
        setBusy('')
      }
    },
    [client, groupId, refresh, userId],
  )

  const add = useCallback(
    async (destinationId: string, rawKilos: string) => {
      if (!client || !userId) return
      const kilos = Number(rawKilos.replace(',', '.'))
      if (!Number.isFinite(kilos) || kilos <= 0) {
        setError('Ingresá una cantidad de kilos mayor a cero.')
        return
      }

      setBusy(destinationId)
      setError('')
      try {
        await addLoadToRepository(client, destinationId, userId, kilos)
        setLoadKilos((values) => ({ ...values, [destinationId]: '' }))
        setNotice('Pesada guardada.')
        await refresh()
      } catch (addError) {
        setError(messageFromError(addError))
      } finally {
        setBusy('')
      }
    },
    [client, refresh, userId],
  )

  const close = useCallback(
    async (destination: Destination) => {
      if (!client) return
      setBusy(destination.id)
      setError('')
      try {
        await closeDestinationInRepository(client, destination.id)
        setNotice('Destino cerrado y guardado en el historial.')
        await refresh()
      } catch (closeError) {
        setError(messageFromError(closeError))
      } finally {
        setBusy('')
      }
    },
    [client, refresh],
  )

  const loadsByDestination = useMemo(() => {
    const byDestination = new Map<string, Load[]>()
    for (const load of loads) {
      const destinationLoads = byDestination.get(load.destination_id) ?? []
      destinationLoads.push(load)
      byDestination.set(load.destination_id, destinationLoads)
    }
    return byDestination
  }, [loads])

  return {
    destinations,
    loads,
    profileNames,
    loadsByDestination,
    totalKilos: loads.reduce((total, load) => total + load.kg, 0),
    activeDestinations: destinations.filter((destination) => destination.status === 'activo'),
    closedDestinations: destinations.filter((destination) => destination.status === 'cerrado'),
    tab,
    setTab,
    destinationType,
    setDestinationType,
    destinationName,
    setDestinationName,
    loadKilos,
    setLoadKilos,
    expandedHistory,
    setExpandedHistory,
    busy,
    error,
    setError,
    notice,
    setNotice,
    live,
    create,
    add,
    close,
  }
}
