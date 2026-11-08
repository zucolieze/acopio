import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, DestinationType } from '../../../lib/database.types'
import { messageFromError } from '../../../utils/errors'
import { HUMIDITY_ERROR, parseHumidity } from '../../../utils/humidity'
import { readStored, writeStored } from '../../../utils/storage'
import {
  addLoad as addLoadToRepository,
  closeDestination as closeDestinationInRepository,
  createDestination as createDestinationInRepository,
  createLot as createLotInRepository,
  fetchGroupActivity,
  softDeleteDestination,
  restoreDestination as restoreDestinationInRepository,
  softDeleteLoad,
  softDeleteLot,
  updateDestination as updateDestinationInRepository,
  updateLoad as updateLoadInRepository,
  updateLoadAttribution,
  updateLot as updateLotInRepository,
  updateLotDetails as updateLotDetailsInRepository,
} from '../model/loadsRepository'
import type { Destination, Field, Load, Lot, LotChanges, Tab, WorkMember } from '../types'

type Client = SupabaseClient<Database>

export function useLoads(
  client: Client | null,
  groupId: string,
  userId: string | undefined,
) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loads, setLoads] = useState<Load[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [workMembers, setWorkMembers] = useState<WorkMember[]>([])
  const [audits, setAudits] = useState<Awaited<ReturnType<typeof fetchGroupActivity>>['audits']>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [activeLotId, setActiveLotId] = useState('')
  const [activeFieldId, setActiveFieldId] = useState('')
  const [newLotName, setNewLotName] = useState('')
  const [newLotCereal, setNewLotCereal] = useState('')
  const [newLotHectares, setNewLotHectares] = useState('')
  const [tab, setTabState] = useState<Tab>('activos')
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

  const setTab = useCallback(
    (next: Tab) => {
      setTabState(next)
      if (groupId) writeStored(`tab:${groupId}`, next)
    },
    [groupId],
  )

  const refresh = useCallback(async () => {
    if (!client || !groupId) return
    try {
      const activity = await fetchGroupActivity(client, groupId)
      setDestinations(activity.destinations)
      setLoads(activity.loads)
      setFields(activity.fields)
      setLots(activity.lots)
      setWorkMembers(activity.workMembers)
      setAudits(activity.audits)
      setProfileNames(activity.profileNames)
      setActiveFieldId((current) =>
        activity.fields.some((field) => field.id === current)
          ? current
          : (activity.fields[0]?.id ?? ''),
      )
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
    setFields([])
    setLots([])
    setWorkMembers([])
    setAudits([])
    setProfileNames({})
    setActiveFieldId('')
    setActiveLotId('')
    setTabState(readStored<Tab>(`tab:${groupId}`) ?? 'activos')
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
        setFields(activity.fields)
        setLots(activity.lots)
        setWorkMembers(activity.workMembers)
        setAudits(activity.audits)
        setProfileNames(activity.profileNames)
        const firstField = activity.fields[0]
        const firstLot = activity.lots.find(
          (lot) => lot.deleted_at === null && lot.field_id === firstField?.id,
        )
        setActiveFieldId(firstField?.id ?? '')
        setActiveLotId(firstLot?.id ?? '')
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fields' },
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
    if (!activeFieldId || !fields.some((field) => field.id === activeFieldId)) {
      setError('Elegí un campo antes de crear un lote.')
      return
    }
    const name = newLotName.trim()
    if (!name) {
      setError('Ingresá el nombre del lote.')
      return
    }

    if (!newLotCereal) {
      setError('Elegí el cereal del lote.')
      return
    }

    const hectares = newLotHectares.trim() ? Number(newLotHectares.replace(',', '.')) : null
    if (hectares !== null && (!Number.isFinite(hectares) || hectares <= 0)) {
      setError('Las hectáreas tienen que ser un número mayor a cero.')
      return
    }

    setBusy('lot')
    setError('')
    setNotice('')
    try {
      const lotId = await createLotInRepository(
        client,
        activeFieldId,
        name,
        newLotCereal,
        hectares,
      )
      setNewLotName('')
      setNewLotCereal('')
      setNewLotHectares('')
      await refresh()
      setActiveLotId(lotId)
      setTab('nuevo')
      setNotice(`Lote “${name}” creado. Ahora abrí el primer destino.`)
    } catch (createError) {
      setError(messageFromError(createError))
    } finally {
      setBusy('')
    }
  }, [activeFieldId, client, fields, newLotCereal, newLotHectares, newLotName, refresh])

  const selectLot = useCallback(
    (lotId: string) => {
      const lot = lots.find((item) => item.id === lotId)
      if (lot) setActiveFieldId(lot.field_id)
      setActiveLotId(lotId)
    },
    [lots],
  )

  const create = useCallback(
    async (
      type: DestinationType,
      name: string,
      capacityKg: string,
      humidity: string,
    ) => {
      if (!client || !userId || !groupId) return
      const destinationLabel =
        type === 'camion'
          ? name.toUpperCase().replace(/[^A-Z0-9]/g, '')
          : name.trim()
      if (
        type === 'camion' &&
        !/^(?:[A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/.test(destinationLabel)
      ) {
        setError('Ingresá una patente válida: ABC123 o AA123BB, sin espacios.')
        return
      }
      if (!activeLotId) {
        setError('Elegí un lote antes de abrir un destino.')
        return
      }
      const capacity = type === 'camion' ? Number(capacityKg.replace(',', '.')) : null
      const initialHumidity = type === 'camion' ? null : parseHumidity(humidity)
      if (type === 'camion' && (!Number.isFinite(capacity) || (capacity ?? 0) <= 0)) {
        setError('Ingresá un límite de kilos mayor a cero para el camión.')
        return
      }
      if (type !== 'camion' && initialHumidity === null) {
        setError(HUMIDITY_ERROR)
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
          destinationLabel,
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

  const updateLotDetails = useCallback(
    async (lot: Lot, changes: LotChanges) => {
      if (!client) return
      const pending: LotChanges = {}
      if (changes.cereal && changes.cereal !== lot.cereal) pending.cereal = changes.cereal
      if (changes.hectares !== undefined && changes.hectares !== lot.hectares) {
        if (changes.hectares !== null && !(changes.hectares > 0)) {
          setError('Las hectáreas tienen que ser un número mayor a cero.')
          return
        }
        pending.hectares = changes.hectares
      }
      if (Object.keys(pending).length === 0) return
      setBusy(lot.id)
      setError('')
      try {
        await updateLotDetailsInRepository(client, lot.id, pending)
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
      if (
        lots.filter(
          (item) => item.field_id === lot.field_id && item.deleted_at === null,
        ).length <= 1
      ) {
        setError('El campo debe conservar al menos un lote activo.')
        return
      }
      setBusy(lot.id)
      setError('')
      try {
        await softDeleteLot(client, lot.id)
        if (lot.id === activeLotId) {
          const replacement = lots.find(
            (item) => item.id !== lot.id && item.field_id === activeFieldId && item.deleted_at === null,
          )
          setActiveLotId(replacement?.id ?? '')
        }
        setNotice('Lote eliminado del selector. El historial queda conservado.')
        await refresh()
      } catch (deleteError) {
        setError(messageFromError(deleteError))
      } finally {
        setBusy('')
      }
    },
    [activeFieldId, activeLotId, client, lots, refresh],
  )

  const updateLoadOwner = useCallback(
    async (load: Load, ownerId: string | null) => {
      if (!client) return
      if (load.created_by === ownerId) return
      setBusy(load.id)
      setError('')
      try {
        await updateLoadAttribution(client, load.id, ownerId)
        setNotice('Responsable actualizado. El cambio quedó registrado.')
        await refresh()
      } catch (updateError) {
        setError(messageFromError(updateError))
      } finally {
        setBusy('')
      }
    },
    [client, refresh],
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
        destination.destination_type === 'camion' ? null : parseHumidity(rawHumidity)
      if (destination.destination_type !== 'camion' && humidity === null) {
        setError(HUMIDITY_ERROR)
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
        setNotice('Pesada eliminada del historial; el movimiento quedó guardado.')
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
        setNotice('Destino eliminado del trabajo; el movimiento quedó guardado.')
        await refresh()
      } catch (deleteError) {
        setError(messageFromError(deleteError))
      } finally {
        setBusy('')
      }
    },
    [client, refresh],
  )

  const restoreDestination = useCallback(
    async (destination: Destination) => {
      if (!client) return
      setBusy(destination.id)
      setError('')
      try {
        await restoreDestinationInRepository(client, destination.id)
        setNotice('Destino restaurado.')
        await refresh()
      } catch (restoreError) {
        setError(messageFromError(restoreError))
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
    fields,
    lots,
    workMembers,
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
    activeFieldId,
    newLotName,
    setNewLotName,
    newLotCereal,
    setNewLotCereal,
    newLotHectares,
    setNewLotHectares,
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
    selectLot,
    updateLotDetails,
    deleteLot,
    create,
    add,
    close,
    editLoad,
    updateLoadOwner,
    deleteLoad,
    editDestination,
    deleteDestination,
    restoreDestination,
  }
}
