import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { MemberRole } from '../lib/database.types'
import { Brand } from '../components/ui/Brand'
import { Feedback } from '../components/ui/Feedback'
import { AuthPage, ModeSelectionPage, useAuth } from '../features/auth'
import { useGroups, WorkMenuPage } from '../features/groups'
import { DashboardPage, destinationLabels, useLoads } from '../features/loads'
import type { AppScreen, WorkMode } from '../types/app'
import { messageFromError } from '../utils/errors'

function roleForMode(mode: WorkMode, isDebugAdmin: boolean): MemberRole {
  if (isDebugAdmin || mode === 'admin') return 'admin'
  return mode === 'carrero' ? 'proveedor' : 'cliente'
}

export default function AppController() {
  const auth = useAuth()
  const groups = useGroups(auth.client, auth.session?.user.id)
  const [screen, setScreen] = useState<AppScreen>('login')
  const [selectedMode, setSelectedMode] = useState<WorkMode | null>(null)
  const [adminMode, setAdminMode] = useState<'observador' | 'carrero'>('observador')
  const [activeGroupId, setActiveGroupId] = useState('')
  const [menuAction, setMenuAction] = useState<'crear' | 'elegir' | 'sumarme' | null>(null)
  const [menuGroupId, setMenuGroupId] = useState('')
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [appError, setAppError] = useState('')
  const [appNotice, setAppNotice] = useState('')

  const loads = useLoads(
    auth.client,
    screen === 'trabajo' ? activeGroupId : '',
    auth.session?.user.id,
  )
  const selectedMembership = groups.memberships.find(
    (membership) => membership.groupId === activeGroupId,
  )
  const isAdminWork =
    auth.isDebugAdmin && selectedMembership?.role === 'admin'
  const isProvider =
    selectedMembership?.role === 'proveedor' ||
    (isAdminWork && adminMode === 'carrero')

  useEffect(() => {
    if (auth.session) {
      if (screen === 'login') {
        setScreen('modalidad')
        setSelectedMode(null)
        setActiveGroupId('')
        setAppError('')
        setAppNotice('')
      }
    } else {
      setScreen('login')
      setSelectedMode(null)
      setActiveGroupId('')
      setMenuAction(null)
    }
  }, [auth.session, screen])

  useEffect(() => {
    setMenuGroupId((current) =>
      groups.memberships.some((membership) => membership.groupId === current)
        ? current
        : (groups.memberships[0]?.groupId ?? ''),
    )
    setActiveGroupId((current) =>
      groups.memberships.some((membership) => membership.groupId === current)
        ? current
        : (groups.memberships[0]?.groupId ?? ''),
    )
  }, [groups.memberships])

  function handleChooseMode(mode: WorkMode) {
    setSelectedMode(mode)
    setAdminMode(mode === 'carrero' ? 'carrero' : 'observador')
    setMenuAction(null)
    setMenuGroupId(groups.memberships[0]?.groupId ?? '')
    setScreen('menu')
    setAppError('')
    setAppNotice('')
  }

  function handleEnterGroup() {
    if (!groups.memberships.some((membership) => membership.groupId === menuGroupId)) {
      setAppError('Elegí un trabajo en el que ya participás.')
      return
    }
    setActiveGroupId(menuGroupId)
    setScreen('trabajo')
    setMenuAction(null)
    loads.setTab('activos')
    setAppError('')
    setAppNotice('')
  }

  async function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedMode || selectedMode === 'observador' || !auth.session) return
    const groupId = await groups.create(
      groupName.trim(),
      roleForMode(selectedMode, auth.isDebugAdmin),
    )
    if (!groupId) return
    setGroupName('')
    setActiveGroupId(groupId)
    setMenuAction(null)
    setScreen('trabajo')
  }

  async function handleJoinGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedMode) return
    const groupId = await groups.join(
      inviteCode.trim().toUpperCase(),
      roleForMode(selectedMode, auth.isDebugAdmin),
    )
    if (!groupId) return
    setInviteCode('')
    setActiveGroupId(groupId)
    setMenuAction(null)
    setScreen('trabajo')
  }

  function handleCloseDestination(destination: Parameters<typeof loads.close>[0]) {
    if (
      window.confirm(
        `¿Cerrar ${destinationLabels[destination.destination_type]} ${destination.name}? Ya no se podrán cargar más kilos.`,
      )
    ) {
      void loads.close(destination)
    }
  }

  async function handleCopyInviteCode() {
    if (!selectedMembership) return
    try {
      await navigator.clipboard.writeText(selectedMembership.inviteCode)
      loads.setNotice('Código copiado. Compartilo con quien necesite sumarse.')
      loads.setError('')
    } catch (copyError) {
      loads.setError(messageFromError(copyError))
    }
  }

  if (auth.configurationError) {
    return (
      <main className="center-page">
        <Brand />
        <section className="panel">
          <h1>Falta conectar la base</h1>
          <p>{auth.configurationError}</p>
          <p className="muted">
            Revisá el archivo <code>.env.local</code> dentro de
            <code> seguimiento-acopio/</code>.
          </p>
        </section>
      </main>
    )
  }

  if (auth.starting || !auth.client) {
    return (
      <main className="center-page">
        <Brand />
        <p role="status">Cargando Acopio…</p>
      </main>
    )
  }

  if (!auth.session) {
    return (
      <AuthPage
        mode={auth.authMode}
        email={auth.email}
        password={auth.password}
        fullName={auth.fullNameInput}
        busy={auth.busy === 'auth'}
        error={auth.error}
        notice={auth.notice}
        onModeChange={auth.setAuthMode}
        onEmailChange={auth.setEmail}
        onPasswordChange={auth.setPassword}
        onFullNameChange={auth.setFullName}
        onSubmit={auth.authMode === 'crear' ? auth.handleSignUp : auth.handleSignIn}
      />
    )
  }

  if (
    (auth.accountLoading || groups.loading) &&
    groups.memberships.length === 0
  ) {
    return (
      <main className="center-page">
        <Brand />
        <p role="status">Cargando tus trabajos…</p>
        <Feedback error={auth.error || groups.error} notice={auth.notice || groups.notice} />
      </main>
    )
  }

  if (screen === 'modalidad') {
    return (
      <ModeSelectionPage
        welcomeName={auth.welcomeName}
        isDebugAdmin={auth.isDebugAdmin}
        busy={auth.busy === 'signout'}
        error={auth.error || groups.error}
        notice={auth.notice}
        onChooseMode={handleChooseMode}
        onSignOut={() => void auth.handleSignOut()}
      />
    )
  }

  if (screen === 'menu' || !selectedMembership) {
    return (
      <WorkMenuPage
        mode={selectedMode}
        action={menuAction}
        memberships={groups.memberships}
        selectedGroupId={menuGroupId}
        groupName={groupName}
        inviteCode={inviteCode}
        busy={groups.busy || auth.busy === 'signout'}
        error={appError || groups.error || auth.error}
        notice={appNotice || groups.notice || auth.notice}
        onActionChange={(action) => {
          setMenuAction(action)
          setAppError('')
        }}
        onSelectedGroupChange={setMenuGroupId}
        onGroupNameChange={setGroupName}
        onInviteCodeChange={setInviteCode}
        onCreate={(event) => void handleCreateGroup(event)}
        onJoin={(event) => void handleJoinGroup(event)}
        onEnter={handleEnterGroup}
        onChangeMode={() => setScreen('modalidad')}
        onSignOut={() => void auth.handleSignOut()}
      />
    )
  }

  return (
    <DashboardPage
      membership={selectedMembership}
      memberships={groups.memberships}
      fullName={auth.fullName}
      activeDestinations={loads.activeDestinations}
      closedDestinations={loads.closedDestinations}
      loadsByDestination={loads.loadsByDestination}
      profileNames={loads.profileNames}
      totalKilos={loads.totalKilos}
      tab={loads.tab}
      destinationType={loads.destinationType}
      destinationName={loads.destinationName}
      loadKilos={loads.loadKilos}
      expandedHistory={loads.expandedHistory}
      busy={loads.busy || (auth.busy === 'signout' ? 'signout' : '')}
      error={loads.error || auth.error}
      notice={loads.notice || auth.notice}
      live={loads.live}
      isProvider={Boolean(isProvider)}
      adminMode={adminMode}
      isDebugAdmin={auth.isDebugAdmin}
      onGroupChange={(groupId) => {
        setActiveGroupId(groupId)
        loads.setTab('activos')
      }}
      onReturnToMenu={() => {
        setScreen('menu')
        setMenuAction(null)
        setAppError('')
        setAppNotice('')
      }}
      onSignOut={() => void auth.handleSignOut()}
      onAdminModeToggle={() =>
        setAdminMode((current) =>
          current === 'observador' ? 'carrero' : 'observador',
        )
      }
      onCopyInviteCode={() => void handleCopyInviteCode()}
      onTabChange={(tab) => {
        loads.setTab(tab)
        loads.setError('')
        loads.setNotice('')
      }}
      onDestinationTypeChange={loads.setDestinationType}
      onDestinationNameChange={loads.setDestinationName}
      onCreateDestination={(type, name) => void loads.create(type, name)}
      onKilosChange={(destinationId, value) =>
        loads.setLoadKilos((values) => ({ ...values, [destinationId]: value }))
      }
      onAddLoad={(destinationId, kilos) => void loads.add(destinationId, kilos)}
      onCloseDestination={handleCloseDestination}
      onHistoryToggle={loads.setExpandedHistory}
    />
  )
}
