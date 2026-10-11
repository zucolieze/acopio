import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  addLoad,
  closeDestination,
  createDestination,
  createGroup,
  fetchGroupActivity,
  fetchMemberships,
  joinGroup,
  type Destination,
  type Load,
  type Membership,
} from './data/acopio'
import {
  type Database,
  type DestinationType,
  type MemberRole,
} from './lib/database.types'
import { getSupabaseClient } from './lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import './App.css'

type Client = SupabaseClient<Database>
type Tab = 'activos' | 'nuevo' | 'historial'

const destinationLabels: Record<DestinationType, string> = {
  camion: 'Camión',
  silo: 'Silo',
  silobolsa: 'Silobolsa',
}

function messageFromError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado. Probá de nuevo.'
}

function getClientState(): { client: Client | null; error: string | null } {
  try {
    return { client: getSupabaseClient(), error: null }
  } catch (error) {
    return { client: null, error: messageFromError(error) }
  }
}

function formatKilos(value: number) {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function App() {
  const [clientState] = useState(getClientState)
  const { client, error: configurationError } = clientState
  const [session, setSession] = useState<Session | null>(null)
  const [starting, setStarting] = useState(Boolean(client))
  const [accountLoading, setAccountLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [otp, setOtp] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeGroupId, setActiveGroupId] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loads, setLoads] = useState<Load[]>([])
  const [profileNames, setProfileNames] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<Tab>('activos')
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [createRole, setCreateRole] = useState<MemberRole>('proveedor')
  const [joinRole, setJoinRole] = useState<MemberRole>('cliente')
  const [destinationType, setDestinationType] =
    useState<DestinationType>('camion')
  const [destinationName, setDestinationName] = useState('')
  const [loadKilos, setLoadKilos] = useState<Record<string, string>>({})
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [busy, setBusy] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [live, setLive] = useState(false)

  const loadAccount = useCallback(
    async (currentSession: Session) => {
      if (!client) return
      setAccountLoading(true)

      try {
        const [{ data: profile, error: profileError }, userMemberships] =
          await Promise.all([
            client
              .from('profiles')
              .select('full_name')
              .eq('id', currentSession.user.id)
              .maybeSingle(),
            fetchMemberships(client, currentSession.user.id),
          ])

        if (profileError) throw profileError

        const savedName =
          profile?.full_name ??
          currentSession.user.user_metadata.full_name ??
          currentSession.user.email?.split('@')[0] ??
          ''
        setFullName(savedName)
        setMemberships(userMemberships)
        setActiveGroupId((selected) =>
          userMemberships.some((membership) => membership.groupId === selected)
            ? selected
            : (userMemberships[0]?.groupId ?? ''),
        )
      } catch (error) {
        setErrorMessage(messageFromError(error))
        throw error
      } finally {
        setAccountLoading(false)
      }
    },
    [client],
  )

  useEffect(() => {
    if (!client) return
    let mounted = true

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setErrorMessage('')
      setNotice('')

      if (nextSession) {
        window.setTimeout(() => {
          if (mounted) void loadAccount(nextSession).catch(() => undefined)
        }, 0)
      } else {
        setMemberships([])
        setActiveGroupId('')
        setDestinations([])
        setLoads([])
        setProfileNames({})
      }
    })

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) throw error
        setSession(data.session)
        if (data.session) void loadAccount(data.session).catch(() => undefined)
      })
      .catch((error: unknown) => {
        if (mounted) setErrorMessage(messageFromError(error))
      })
      .finally(() => {
        if (mounted) setStarting(false)
      })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [client, loadAccount])

  const refreshActivity = useCallback(async () => {
    if (!client || !activeGroupId) return

    try {
      const activity = await fetchGroupActivity(client, activeGroupId)
      setDestinations(activity.destinations)
      setLoads(activity.loads)
      setProfileNames(activity.profileNames)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(messageFromError(error))
    }
  }, [activeGroupId, client])

  useEffect(() => {
    if (!client || !activeGroupId) return
    let mounted = true

    void fetchGroupActivity(client, activeGroupId)
      .then((activity) => {
        if (!mounted) return
        setDestinations(activity.destinations)
        setLoads(activity.loads)
        setProfileNames(activity.profileNames)
      })
      .catch((error: unknown) => {
        if (mounted) setErrorMessage(messageFromError(error))
      })

    const channel = client
      .channel(`group-activity-${activeGroupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'destinations',
          filter: `group_id=eq.${activeGroupId}`,
        },
        () => void refreshActivity(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'loads' },
        () => void refreshActivity(),
      )
      .subscribe((status) => {
        if (mounted) setLive(status === 'SUBSCRIBED')
      })

    return () => {
      mounted = false
      setLive(false)
      void client.removeChannel(channel)
    }
  }, [activeGroupId, client, refreshActivity])

  const selectedMembership = memberships.find(
    (membership) => membership.groupId === activeGroupId,
  )
  const isProvider = selectedMembership?.role === 'proveedor'

  const loadsByDestination = useMemo(() => {
    const byDestination = new Map<string, Load[]>()
    for (const load of loads) {
      const destinationLoads = byDestination.get(load.destination_id) ?? []
      destinationLoads.push(load)
      byDestination.set(load.destination_id, destinationLoads)
    }
    return byDestination
  }, [loads])

  const totalKilos = useMemo(
    () => loads.reduce((total, load) => total + load.kg, 0),
    [loads],
  )

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setBusy('auth')
    setErrorMessage('')
    setNotice('')

    try {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: { full_name: fullName.trim() },
        },
      })
      if (error) throw error
      setCodeSent(true)
      setNotice('Te mandamos un código de 6 dígitos. Revisá tu correo.')
    } catch (error) {
      setErrorMessage(messageFromError(error))
    } finally {
      setBusy('')
    }
  }

  async function handleResendCode() {
    if (!client) return
    setBusy('auth')
    setErrorMessage('')
    setNotice('')

    try {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: { full_name: fullName.trim() },
        },
      })
      if (error) throw error
      setNotice('Te mandamos otro código. Revisá tu correo.')
    } catch (error) {
      setErrorMessage(messageFromError(error))
    } finally {
      setBusy('')
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setBusy('auth')
    setErrorMessage('')

    try {
      const { data, error } = await client.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      })
      if (error) throw error
      if (!data.session) {
        throw new Error('El código no creó una sesión. Pedí uno nuevo e intentá otra vez.')
      }

      const { error: profileError } = await client
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', data.session.user.id)
      if (profileError) throw profileError

      setSession(data.session)
      await loadAccount(data.session)
      setNotice('Sesión iniciada.')
    } catch (error) {
      setErrorMessage(messageFromError(error))
    } finally {
      setBusy('')
    }
  }

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client || !session) return
    setBusy('group')
    setErrorMessage('')

    try {
      await createGroup(client, groupName.trim(), createRole)
      await loadAccount(session)
      setGroupName('')
      setNotice('Grupo creado. Ya podés compartir el código de invitación.')
    } catch (error) {
      setErrorMessage(messageFromError(error))
    } finally {
      setBusy('')
    }
  }

  async function handleJoinGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client || !session) return
    setBusy('group')
    setErrorMessage('')

    try {
      await joinGroup(client, inviteCode.trim().toUpperCase(), joinRole)
      await loadAccount(session)
      setInviteCode('')
      setNotice('Te sumaste al grupo.')
    } catch (error) {
      setErrorMessage(messageFromError(error))
    } finally {
      setBusy('')
    }
  }

  async function handleCreateDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client || !session || !activeGroupId) return
    setBusy('destination')
    setErrorMessage('')

    try {
      await createDestination(
        client,
        activeGroupId,
        session.user.id,
        destinationType,
        destinationName.trim(),
      )
      setDestinationName('')
      setTab('activos')
      setNotice('Destino abierto. Ya podés cargar kilos.')
      await refreshActivity()
    } catch (error) {
      setErrorMessage(messageFromError(error))
    } finally {
      setBusy('')
    }
  }

  async function handleAddLoad(
    event: FormEvent<HTMLFormElement>,
    destinationId: string,
  ) {
    event.preventDefault()
    if (!client || !session) return
    const rawKilos = loadKilos[destinationId] ?? ''
    const kilos = Number(rawKilos.replace(',', '.'))
    if (!Number.isFinite(kilos) || kilos <= 0) {
      setErrorMessage('Ingresá una cantidad de kilos mayor a cero.')
      return
    }

    setBusy(destinationId)
    setErrorMessage('')
    try {
      await addLoad(client, destinationId, session.user.id, kilos)
      setLoadKilos((values) => ({ ...values, [destinationId]: '' }))
      setNotice('Pesada guardada.')
      await refreshActivity()
    } catch (error) {
      setErrorMessage(messageFromError(error))
    } finally {
      setBusy('')
    }
  }

  async function handleCloseDestination(destination: Destination) {
    if (!client) return
    const confirmed = window.confirm(
      `¿Cerrar ${destinationLabels[destination.destination_type]} ${destination.name}? Ya no se podrán cargar más kilos.`,
    )
    if (!confirmed) return

    setBusy(destination.id)
    setErrorMessage('')
    try {
      await closeDestination(client, destination.id)
      setNotice('Destino cerrado y guardado en el historial.')
      await refreshActivity()
    } catch (error) {
      setErrorMessage(messageFromError(error))
    } finally {
      setBusy('')
    }
  }

  async function handleSignOut() {
    if (!client) return
    setBusy('signout')
    setErrorMessage('')
    try {
      const { error } = await client.auth.signOut()
      if (error) throw error
    } catch (error) {
      setErrorMessage(messageFromError(error))
    } finally {
      setBusy('')
    }
  }

  async function handleCopyInviteCode() {
    if (!selectedMembership) return
    try {
      await navigator.clipboard.writeText(selectedMembership.inviteCode)
      setNotice('Código copiado. Compartilo con quien necesite sumarse.')
    } catch (error) {
      setErrorMessage(messageFromError(error))
    }
  }

  if (configurationError) {
    return (
      <main className="center-page">
        <Brand />
        <section className="panel">
          <h1>Falta conectar la base</h1>
          <p>{configurationError}</p>
          <p className="muted">
            Revisá el archivo <code>.env.local</code> dentro de
            <code> seguimiento-acopio/</code>.
          </p>
        </section>
      </main>
    )
  }

  if (starting || !client) {
    return (
      <main className="center-page">
        <Brand />
        <p role="status">Cargando Acopio…</p>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="center-page">
        <Brand />
        <section className="panel auth-panel">
          <p className="eyebrow">Seguimiento de cosecha</p>
          <h1>{codeSent ? 'Revisá tu correo' : 'Entrá a Acopio'}</h1>
          <p className="muted">
            {codeSent
              ? `Mandamos un código de acceso a ${email}.`
              : 'Registrá los kilos del campo y compartí el seguimiento con tu equipo.'}
          </p>

          {codeSent ? (
            <form className="form-stack" onSubmit={handleVerifyCode}>
              <label>
                Código de 6 dígitos
                <input
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                />
              </label>
              <button className="button button--primary" disabled={busy === 'auth'}>
                {busy === 'auth' ? 'Verificando…' : 'Ingresar'}
              </button>
              <button
                className="button button--quiet"
                type="button"
                onClick={() => {
                  setCodeSent(false)
                  setOtp('')
                  setErrorMessage('')
                }}
              >
                Usar otro correo
              </button>
              <button
                className="link-button"
                type="button"
                disabled={busy === 'auth'}
                onClick={() => void handleResendCode()}
              >
                Enviar otro código
              </button>
            </form>
          ) : (
            <form className="form-stack" onSubmit={handleSendCode}>
              <label>
                Tu nombre
                <input
                  autoComplete="name"
                  maxLength={120}
                  placeholder="Ej.: Juan"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
              <label>
                Correo electrónico
                <input
                  autoComplete="email"
                  inputMode="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <button className="button button--primary" disabled={busy === 'auth'}>
                {busy === 'auth' ? 'Enviando…' : 'Mandarme un código'}
              </button>
            </form>
          )}
          <Feedback error={errorMessage} notice={notice} />
        </section>
      </main>
    )
  }

  if (accountLoading && memberships.length === 0) {
    return (
      <main className="center-page">
        <Brand />
        <p role="status">Cargando tus grupos…</p>
        <Feedback error={errorMessage} notice={notice} />
      </main>
    )
  }

  if (!selectedMembership) {
    return (
      <main className="center-page center-page--top">
        <header className="simple-header">
          <Brand />
          <button
            className="button button--quiet"
            type="button"
            disabled={busy === 'signout'}
            onClick={() => void handleSignOut()}
          >
            Salir
          </button>
        </header>
        <section className="onboarding">
          <p className="eyebrow">Un primer paso</p>
          <h1>Conectá a tu equipo</h1>
          <p className="muted">
            Creá un grupo para compartir los kilos o sumate con un código de invitación.
          </p>
          <Feedback error={errorMessage} notice={notice} />

          <div className="onboarding__grid">
            <form className="panel form-stack" onSubmit={handleCreateGroup}>
              <h2>Crear grupo</h2>
              <label>
                Nombre del grupo o campo
                <input
                  maxLength={100}
                  placeholder="Ej.: El Molino"
                  required
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                />
              </label>
              <RoleSelect value={createRole} onChange={setCreateRole} />
              <button className="button button--primary" disabled={busy === 'group'}>
                {busy === 'group' ? 'Creando…' : 'Crear grupo'}
              </button>
            </form>

            <form className="panel form-stack" onSubmit={handleJoinGroup}>
              <h2>Sumarme a un grupo</h2>
              <label>
                Código de invitación
                <input
                  autoCapitalize="characters"
                  maxLength={6}
                  minLength={6}
                  placeholder="6 caracteres"
                  required
                  value={inviteCode}
                  onChange={(event) =>
                    setInviteCode(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-HJ-NP-Z2-9]/g, '')
                        .slice(0, 6),
                    )
                  }
                />
              </label>
              <RoleSelect value={joinRole} onChange={setJoinRole} />
              <button className="button button--secondary" disabled={busy === 'group'}>
                {busy === 'group' ? 'Ingresando…' : 'Sumarme'}
              </button>
            </form>
          </div>
        </section>
      </main>
    )
  }

  const activeDestinations = destinations.filter(
    (destination) => destination.status === 'activo',
  )
  const closedDestinations = destinations.filter(
    (destination) => destination.status === 'cerrado',
  )
  const tabs: { id: Tab; label: string }[] = [
    { id: 'activos', label: 'Activos' },
    ...(isProvider ? [{ id: 'nuevo' as const, label: 'Nuevo' }] : []),
    { id: 'historial', label: 'Historial' },
  ]

  return (
    <main className="app-shell">
      <header className="app-header">
        <Brand />
        <div className="app-header__actions">
          <label className="group-picker">
            <span className="sr-only">Grupo de trabajo</span>
            <select
              aria-label="Grupo de trabajo"
              value={activeGroupId}
              onChange={(event) => {
                setActiveGroupId(event.target.value)
                setTab('activos')
              }}
            >
              {memberships.map((membership) => (
                <option key={membership.groupId} value={membership.groupId}>
                  {membership.groupName}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button button--quiet button--small"
            type="button"
            disabled={busy === 'signout'}
            onClick={() => void handleSignOut()}
          >
            Salir
          </button>
        </div>
      </header>

      <section className="dashboard">
        <div className="dashboard__intro">
          <div>
            <p className="eyebrow">Registro de kilos</p>
            <h1>{selectedMembership.groupName}</h1>
            <p className="muted">
              {isProvider
                ? 'Cargá las pesadas; tu equipo ve los kilos al instante.'
                : 'Seguimiento de las pesadas cargadas por tu equipo.'}
            </p>
          </div>
          <div className="group-code">
            <span>Invitación</span>
            <strong>{selectedMembership.inviteCode}</strong>
            <button
              className="link-button"
              type="button"
              onClick={() => void handleCopyInviteCode()}
            >
              Copiar código
            </button>
          </div>
        </div>

        <div className="summary-row">
          <div className="summary-card">
            <span>Kilos registrados</span>
            <strong>{formatKilos(totalKilos)} kg</strong>
          </div>
          <div className="summary-card">
            <span>Destinos activos</span>
            <strong>{activeDestinations.length}</strong>
          </div>
          <div className="connection-state" role="status">
            <span className={live ? 'connection-state__dot is-live' : 'connection-state__dot'} />
            {live ? 'En línea' : 'Conectando'}
          </div>
        </div>

        <Feedback error={errorMessage} notice={notice} />

        <nav className="tabs" aria-label="Secciones">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? 'tabs__button is-selected' : 'tabs__button'}
              type="button"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => {
                setTab(item.id)
                setErrorMessage('')
                setNotice('')
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'nuevo' && isProvider && (
          <section className="new-destination panel">
            <p className="eyebrow">Abrir destino</p>
            <h2>¿Dónde se van a juntar los kilos?</h2>
            <p className="muted">
              Elegí un tipo y poné un nombre para reconocerlo.
            </p>
            <form className="form-stack" onSubmit={handleCreateDestination}>
              <div className="destination-types" role="group" aria-label="Tipo de destino">
                {(Object.keys(destinationLabels) as DestinationType[]).map((type) => (
                  <button
                    key={type}
                    className={
                      destinationType === type
                        ? 'type-choice is-selected'
                        : 'type-choice'
                    }
                    type="button"
                    aria-pressed={destinationType === type}
                    onClick={() => setDestinationType(type)}
                  >
                    {destinationLabels[type]}
                  </button>
                ))}
              </div>
              <label>
                Nombre o número
                <input
                  autoComplete="off"
                  maxLength={120}
                  placeholder={
                    destinationType === 'camion'
                      ? 'Ej.: Camión 1'
                      : destinationType === 'silo'
                        ? 'Ej.: Silo 3'
                        : 'Ej.: Bolsa 12'
                  }
                  required
                  value={destinationName}
                  onChange={(event) => setDestinationName(event.target.value)}
                />
              </label>
              <button
                className="button button--primary button--large"
                disabled={busy === 'destination'}
              >
                {busy === 'destination' ? 'Abriendo destino…' : 'Abrir destino'}
              </button>
            </form>
          </section>
        )}

        {tab === 'activos' && (
          <section className="destination-list" aria-live="polite">
            {activeDestinations.length === 0 ? (
              <EmptyState
                title="Todavía no hay destinos activos"
                description={
                  isProvider
                    ? 'Tocá “Nuevo” para abrir un camión, silo o silobolsa.'
                    : 'Cuando el proveedor abra un destino, va a aparecer acá.'
                }
              />
            ) : (
              activeDestinations.map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  entries={loadsByDestination.get(destination.id) ?? []}
                  profileNames={profileNames}
                  isProvider={Boolean(isProvider)}
                  busy={busy === destination.id}
                  kilos={loadKilos[destination.id] ?? ''}
                  onKilosChange={(value) =>
                    setLoadKilos((values) => ({
                      ...values,
                      [destination.id]: value,
                    }))
                  }
                  onAddLoad={(event) => void handleAddLoad(event, destination.id)}
                  onClose={() => void handleCloseDestination(destination)}
                />
              ))
            )}
          </section>
        )}

        {tab === 'historial' && (
          <section className="destination-list" aria-live="polite">
            {closedDestinations.length === 0 ? (
              <EmptyState
                title="Todavía no hay destinos cerrados"
                description="Los destinos cerrados y sus kilos van a quedar guardados acá."
              />
            ) : (
              closedDestinations.map((destination) => {
                const entries = loadsByDestination.get(destination.id) ?? []
                const expanded = expandedHistory === destination.id
                return (
                  <article className="destination-card" key={destination.id}>
                    <button
                      className="history-toggle"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedHistory(expanded ? null : destination.id)
                      }
                    >
                      <DestinationHeading
                        destination={destination}
                        entries={entries}
                        closed
                      />
                      <span className="history-toggle__icon" aria-hidden="true">
                        {expanded ? '−' : '+'}
                      </span>
                    </button>
                    {expanded && (
                      <LoadList entries={entries} profileNames={profileNames} />
                    )}
                  </article>
                )
              })
            )}
          </section>
        )}
      </section>
      <footer className="app-footer">
        {fullName ? `Ingresaste como ${fullName}.` : 'Seguimiento de cosecha'}
      </footer>
    </main>
  )
}

function Brand() {
  return (
    <a className="brand" href="/" aria-label="Acopio, inicio">
      <span className="brand__mark" aria-hidden="true">
        A
      </span>
      <span>Acopio</span>
    </a>
  )
}

function Feedback({ error, notice }: { error: string; notice: string }) {
  return (
    <>
      {error && (
        <p className="feedback feedback--error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="feedback feedback--notice" role="status">
          {notice}
        </p>
      )}
    </>
  )
}

function RoleSelect({
  value,
  onChange,
}: {
  value: MemberRole
  onChange: (role: MemberRole) => void
}) {
  return (
    <label>
      Tu rol en el grupo
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value === 'proveedor' ? 'proveedor' : 'cliente')
        }
      >
        <option value="proveedor">Proveedor — cargo los kilos</option>
        <option value="cliente">Cliente — solo sigo los kilos</option>
      </select>
    </label>
  )
}

function DestinationCard({
  destination,
  entries,
  profileNames,
  isProvider,
  busy,
  kilos,
  onKilosChange,
  onAddLoad,
  onClose,
}: {
  destination: Destination
  entries: Load[]
  profileNames: Record<string, string>
  isProvider: boolean
  busy: boolean
  kilos: string
  onKilosChange: (value: string) => void
  onAddLoad: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}) {
  return (
    <article className="destination-card">
      <DestinationHeading destination={destination} entries={entries} />
      {isProvider && (
        <form className="load-form" onSubmit={onAddLoad}>
          <label>
            Kilos de esta pesada
            <input
              inputMode="decimal"
              min="0.01"
              placeholder="Ej.: 12500"
              required
              step="0.01"
              type="number"
              value={kilos}
              onChange={(event) => onKilosChange(event.target.value)}
            />
          </label>
          <button className="button button--primary button--large" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar pesada'}
          </button>
        </form>
      )}
      <LoadList entries={entries.slice(0, 3)} profileNames={profileNames} />
      {entries.length > 3 && (
        <p className="muted small-copy">Se muestran las últimas 3 pesadas.</p>
      )}
      {isProvider && (
        <button
          className="link-button destination-card__close"
          type="button"
          disabled={busy}
          onClick={onClose}
        >
          Cerrar destino
        </button>
      )}
    </article>
  )
}

function DestinationHeading({
  destination,
  entries,
  closed = false,
}: {
  destination: Destination
  entries: Load[]
  closed?: boolean
}) {
  const total = entries.reduce((sum, entry) => sum + entry.kg, 0)
  return (
    <div className="destination-heading">
      <div className="destination-heading__topline">
        <span className={closed ? 'status-badge is-closed' : 'status-badge'}>
          {closed ? 'Cerrado' : 'Activo'}
        </span>
        <span className="destination-heading__type">
          {destinationLabels[destination.destination_type]}
        </span>
      </div>
      <div className="destination-heading__body">
        <div>
          <h2>{destination.name}</h2>
          <p className="muted">
            {entries.length} {entries.length === 1 ? 'pesada' : 'pesadas'}
            {closed && destination.closed_at
              ? ` · Cerrado ${formatDate(destination.closed_at)}`
              : ''}
          </p>
        </div>
        <strong className="destination-total">{formatKilos(total)} kg</strong>
      </div>
    </div>
  )
}

function LoadList({
  entries,
  profileNames,
}: {
  entries: Load[]
  profileNames: Record<string, string>
}) {
  if (entries.length === 0) {
    return <p className="empty-loads">Todavía no se cargaron pesadas.</p>
  }

  return (
    <ul className="load-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <div className="load-list__details">
            <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            <span>
              Cargó{' '}
              {entry.created_by
                ? (profileNames[entry.created_by] ?? 'Integrante del grupo')
                : 'Integrante del grupo'}
            </span>
          </div>
          <strong>{formatKilos(entry.kg)} kg</strong>
        </li>
      ))}
    </ul>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        🌾
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

export default App
