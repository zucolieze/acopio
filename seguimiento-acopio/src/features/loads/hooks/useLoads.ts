import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, DestinationType } from '../../../lib/database.types'
import { messageFromError } from '../../../utils/errors'
import {
  addLoad as addLoadToRepository,
  closeDestination as closeDestinationInRepository,
  createDestination as createDestinationInRepository,
  createLot as createLotInRepository,
  fetchGroupActivity,
  softDeleteDestination,
  softDeleteLoad,
  softDeleteLot,
  updateDestination as updateDestinationInRepository,
  updateLoad as updateLoadInRepository,
  updateLot as updateLotInRepository,
} from '../model/loadsRepository'
import type { Destination, Load, Lot, Tab } from '../types'

type Client = SupabaseClient<Database>

export function useLoads(
  client: Client | null,
  groupId: string,
  userId: string | undefined,
) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loads, setLoads] = useState<Load[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [audits, setAudits] = useState<Awaited<ReturnType<typeof fetchGroupActivity>>['audits']>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [activeLotId, setActiveLotId] = useState('')
  const [newLotName, setNewLotName] = useState('')
  const [tab, setTab] = useState<Tab>('activos')
  const [destinationType, setDestinationType] =
    useState<DestinationType>('camion')
  const [destinationName, setDestinationName] = useState('')
  const [truckCapacity, setTruckCapacity] = useState('')
  const [openingHumidity, setOpeningHumidity] = useState('')
  const [closingHumidity, setClosingHumidity] = useState<Record<string, string>>({})
  const [loadKilos, setLoadKilos] = useState<Record<string, string>>({})
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [busy, setBusy] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [live, setLive] = useState(false)

  const refresh = useCallback(async () => {
    if (!client || !groupId) return
    try {
      const activity = await fetchGroupActivity(client, groupId)
      setDestinations(activity.destinations)
      setLoads(activity.loads)
      setLots(activity.lots)
      setAudits(activity.audits)
      setProfileNames(activity.profileNames)
      setActiveLotId((current) =>
        activity.lots.some((lot) => lot.id === current && lot.deleted_at === null)
          ? current
          : (activity.lots.find((lot) => lot.deleted_at === null)?.id ?? ''),
      )
      setError('')
    } catch (refreshError) {
      setError(messageFromError(refreshError))
      throw refreshError
    }
  }, [client, groupId])

  useEffect(() => {
    setDestinations([])
    setLoads([])
    setLots([])
    setAudits([])
    setProfileNames({})
    setActiveLotId('')
    setTab('activos')
    setLoading(false)
    setError('')
    setNotice('')
    if (!client || !groupId) return
    let mounted = true
    setLoading(true)

    void fetchGroupActivity(client, groupId)
      .then((activity) => {
        if (!mounted) return
        setDestinations(activity.destinations)
        setLoads(activity.loads)
        setLots(activity.lots)
        setAudits(activity.audits)
        setProfileNames(activity.profileNames)
        setActiveLotId(
          activity.lots.find((lot) => lot.deleted_at === null)?.id ?? '',
        )
        setLoading(false)
      })
      .catch((loadError: unknown) => {
        if (mounted) {
          setError(messageFromError(loadError))
          setLoading(false)
        }
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'change_audit',
          filter: `group_id=eq.${groupId}`,
        },
        () => void refresh().catch(() => undefined),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lots' },
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

  const createLot = useCallback(async () => {
    if (!client) return
    const selectedLot = lots.find((lot) => lot.id === activeLotId)
    if (!selectedLot) {
      setError('No se encontró un lote del trabajo para crear otro.')
      return
    }
    const name = newLotName.trim()
    if (!name) {
      setError('Ingresá el nombre del lote.')
      return
    }

    setBusy('lot')
    setError('')
    setNotice('')
    try {
      const lotId = await createLotInRepository(client, selectedLot.field_id, name)
      setNewLotName('')
      await refresh()
      setActiveLotId(lotId)
      setNotice(`Lote “${name}” creado y seleccionado.`)
    } catch (createError) {
      setError(messageFromError(createError))
    } finally {
      setBusy('')
    }
  }, [activeLotId, client, lots, newLotName, refresh])

  const create = useCallback(
    async (
      type: DestinationType,
      name: string,
      capacityKg: string,
      humidity: string,
    ) => {
      if (!client || !userId || !groupId) return
      if (!activeLotId) {
        setError('Elegí un lote antes de abrir un destino.')
        return
      }
      const capacity = type === 'camion' ? Number(capacityKg.replace(',', '.')) : null
      const initialHumidity =
        type === 'camion' || !humidity.trim()
          ? null
          : Number(humidity.replace(',', '.'))
      if (type === 'camion' && (!Number.isFinite(capacity) || (capacity ?? 0) <= 0)) {
        setError('Ingresá un límite de kilos mayor a cero para el camión.')
        return
      }
      if (
        type !== 'camion' &&
        (initialHumidity === null ||
          !Number.isFinite(initialHumidity) ||
          (initialHumidity ?? -1) < 0 ||
          (initialHumidity ?? 101) > 100)
      ) {
        setError('Ingresá una humedad inicial entre 0 y 100 %.')
        return
      }

      setBusy('destination')
      setError('')
      setNotice('')
      try {
        await createDestinationInRepository(
          client,
          groupId,
          userId,
          activeLotId,
          type,
          name,
          capacity,
          initialHumidity,
        )
        setDestinationName('')
        setTruckCapacity('')
        setOpeningHumidity('')
        setTab('activos')
        setNotice('Destino abierto. Ya podés cargar kilos.')
        await refresh()
      } catch (createError) {
        setError(messageFromError(createError))
      } finally {
        setBusy('')
      }
    },
    [activeLotId, client, groupId, refresh, userId],
  )

  const editLot = useCallback(
    async (lot: Lot, name: string) => {
      if (!client) return
      const trimmedName = name.trim()
      if (!trimmedName) {
        setError('Ingresá el nombre del lote.')
        return
      }
      setBusy(lot.id)
      setError('')
      try {
        await updateLotInRepository(client, lot.id, trimmedName)
        setNotice('Lote actualizado. El cambio quedó registrado.')
        await refresh()
      } catch (editError) {
        setError(messageFromError(editError))
      } finally {
        setBusy('')
      }
    },
    [client, refresh],
  )

  const deleteLot = useCallback(
    async (lot: Lot) => {
      if (!client) return
      if (lots.filter((item) => item.deleted_at === null).length <= 1) {
        setError('El trabajo debe conservar al menos un lote activo.')
        return
      }
      setBusy(lot.id)
      setError('')
      try {
        await softDeleteLot(client, lot.id)
        setNotice('Lote eliminado del selector. El historial queda conservado.')
        await refresh()
      } catch (deleteError) {
        setError(messageFromError(deleteError))
      } finally {
        setBusy('')
      }
    },
    [client, lots, refresh],
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
    async (destination: Destination, rawHumidity: string) => {
      if (!client) return
      const humidity =
        destination.destination_type === 'camion'
          ? null
          : rawHumidity.trim()
            ? Number(rawHumidity.replace(',', '.'))
            : null
      if (
        destination.destination_type !== 'camion' &&
        (humidity === null ||
          !Number.isFinite(humidity) ||
          humidity < 0 ||
          humidity > 100)
      ) {
        setError('Ingresá una humedad de cierre entre 0 y 100 %.')
        return
      }
      setBusy(destination.id)
      setError('')
      try {
        await closeDestinationInRepository(client, destination.id, humidity)
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

  const editLoad = useCallback(
    async (load: Load, kilos: string, date: string) => {
      if (!client) return
      const kg = Number(kilos.replace(',', '.'))
      const parsedDate = new Date(date)
      if (!Number.isFinite(kg) || kg <= 0) {
        setError('Ingresá una cantidad de kilos mayor a cero.')
        return
      }
      if (!date || Number.isNaN(parsedDate.getTime())) {
        setError('Ingresá una fecha y hora válidas.')
        return
      }
      setBusy(load.id)
      setError('')
      try {
        await updateLoadInRepository(client, load.id, kg, parsedDate.toISOString())
        setNotice('Pesada actualizada. El cambio quedó registrado en el historial.')
        await refresh()
      } catch (editError) {
        setError(messageFromError(editError))
      } finally {
        setBusy('')
      }
    },
    [client, refresh],
  )

  const deleteLoad = useCallback(
    async (load: Load) => {
      if (!client) return
      setBusy(load.id)
      setError('')
      try {
        await softDeleteLoad(client, load.id)
        setNotice('Pesada eliminada del historial; el movimiento quedó auditado.')
        await refresh()
      } catch (deleteError) {
        setError(messageFromError(deleteError))
      } finally {
        setBusy('')
      }
    },
    [client, refresh],
  )

  const editDestination = useCallback(
    async (
      destination: Destination,
      changes: Parameters<typeof updateDestinationInRepository>[2],
    ) => {
      if (!client) return
      setBusy(destination.id)
      setError('')
      try {
        await updateDestinationInRepository(client, destination.id, changes)
        setNotice('Destino actualizado. Los cambios quedaron registrados.')
        await refresh()
      } catch (editError) {
        setError(messageFromError(editError))
      } finally {
        setBusy('')
      }
    },
    [client, refresh],
  )

  const deleteDestination = useCallback(
    async (destination: Destination) => {
      if (!client) return
      setBusy(destination.id)
      setError('')
      try {
        await softDeleteDestination(client, destination.id)
        setNotice('Destino eliminado del trabajo; el movimiento quedó auditado.')
        await refresh()
      } catch (deleteError) {
        setError(messageFromError(deleteError))
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

  const lotsById = useMemo(
    () => new Map(lots.map((lot) => [lot.id, lot])),
    [lots],
  )

  return {
    destinations,
    loads,
    lots,
    lotsById,
    audits,
    profileNames,
    loadsByDestination,
    totalKilos: loads.reduce((total, load) => total + load.kg, 0),
    activeDestinations: destinations.filter(
      (destination) => destination.status === 'activo' && destination.deleted_at === null,
    ),
    closedDestinations: destinations.filter(
      (destination) =>
        destination.status === 'cerrado' && destination.deleted_at === null,
    ),
    deletedDestinations: destinations.filter(
      (destination) => destination.deleted_at !== null,
    ),
    activeLots: lots.filter((lot) => lot.deleted_at === null),
    tab,
    setTab,
    activeLotId,
    setActiveLotId,
    newLotName,
    setNewLotName,
    destinationType,
    setDestinationType,
    destinationName,
    setDestinationName,
    truckCapacity,
    setTruckCapacity,
    openingHumidity,
    setOpeningHumidity,
    closingHumidity,
    setClosingHumidity,
    loadKilos,
    setLoadKilos,
    expandedHistory,
    setExpandedHistory,
    busy,
    loading,
    error,
    setError,
    notice,
    setNotice,
    live,
    createLot,
    editLot,
    deleteLot,
    create,
    add,
    close,
    editLoad,
    deleteLoad,
    editDestination,
    deleteDestination,
  }
}
