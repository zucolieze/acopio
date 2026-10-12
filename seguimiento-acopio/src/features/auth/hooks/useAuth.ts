import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Database } from '../../../lib/database.types'
import { getSupabaseClient } from '../../../lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { messageFromError } from '../../../utils/errors'
import {
  fetchFullName,
  signIn as signInAccount,
  signOut as signOutAccount,
  signUp as signUpAccount,
} from '../model/authRepository'
import { debugAdminConfig } from '../model/debugConfig'
import type { AuthMode } from '../types'

type Client = SupabaseClient<Database>

function createClientState(): { client: Client | null; error: string | null } {
  try {
    return { client: getSupabaseClient(), error: null }
  } catch (error) {
    return { client: null, error: messageFromError(error) }
  }
}

export function useAuth() {
  const [clientState] = useState(createClientState)
  const { client, error: configurationError } = clientState
  const [session, setSession] = useState<Session | null>(null)
  const [starting, setStarting] = useState(Boolean(client))
  const [accountLoading, setAccountLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authMode, setAuthMode] = useState<AuthMode>('entrar')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadAccount = useCallback(
    async (currentSession: Session) => {
      if (!client) return
      setAccountLoading(true)

      try {
        const name = await fetchFullName(client, currentSession)
        setFullName(name)
      } catch (loadError) {
        setError(messageFromError(loadError))
        throw loadError
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
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setError('')
      setNotice('')

      if (!nextSession) {
        setFullName('')
        return
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        window.setTimeout(() => {
          if (mounted) void loadAccount(nextSession).catch(() => undefined)
        }, 0)
      }
    })

    void client.auth
      .getSession()
      .then(async ({ data, error: sessionError }) => {
        if (sessionError) throw sessionError
        if (!mounted) return
        setSession(data.session)
        if (data.session) await loadAccount(data.session)
      })
      .catch((loadError: unknown) => {
        if (mounted) setError(messageFromError(loadError))
      })
      .finally(() => {
        if (mounted) setStarting(false)
      })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [client, loadAccount])

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setBusy('auth')
    setError('')
    setNotice('')

    try {
      const nextSession = await signInAccount(client, email.trim(), password)
      setSession(nextSession)
      await loadAccount(nextSession)
    } catch (authError) {
      setError(messageFromError(authError))
    } finally {
      setBusy('')
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    setBusy('auth')
    setError('')
    setNotice('')

    try {
      const nextSession = await signUpAccount(
        client,
        email.trim(),
        password,
        fullName.trim(),
      )

      if (nextSession) {
        setSession(nextSession)
        await loadAccount(nextSession)
        setNotice('Cuenta creada.')
      } else {
        setAuthMode('entrar')
        setNotice('Cuenta creada. Iniciá sesión con tu correo y contraseña.')
      }
    } catch (authError) {
      setError(messageFromError(authError))
    } finally {
      setBusy('')
    }
  }

  async function handleSignOut() {
    if (!client) return
    setBusy('signout')
    setError('')
    try {
      await signOutAccount(client)
    } catch (authError) {
      setError(messageFromError(authError))
    } finally {
      setBusy('')
    }
  }

  const isDebugAdmin =
    debugAdminConfig.enabled &&
    session?.user.email?.toLowerCase() === debugAdminConfig.email &&
    session.user.app_metadata.debug_admin === true

  return {
    client,
    configurationError,
    session,
    fullName,
    welcomeName: session?.user.email?.split('@')[0] || fullName || 'ahí',
    starting,
    accountLoading,
    email,
    setEmail,
    password,
    setPassword,
    fullNameInput: fullName,
    setFullName,
    authMode,
    setAuthMode,
    busy,
    error,
    setError,
    notice,
    setNotice,
    isDebugAdmin,
    handleSignIn,
    handleSignUp,
    handleSignOut,
  }
}
