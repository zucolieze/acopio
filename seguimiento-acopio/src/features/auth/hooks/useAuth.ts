import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../lib/database.types'
import { getSupabaseClient } from '../../../lib/supabase'
import { messageFromError } from '../../../utils/errors'
import {
  authErrorMessage,
  clearAuthErrorFromUrl,
  fetchProfileName,
  readAuthErrorFromUrl,
  saveProfileName,
  sendMagicLink,
  sendPasswordReset,
  signIn as signInAccount,
  signInWithGoogle,
  signOut as signOutAccount,
  signUp as signUpAccount,
  updatePassword as updateAccountPassword,
} from '../model/authRepository'
import type { AuthMode } from '../types'

type Client = SupabaseClient<Database>

const RESEND_SECONDS = 60

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
  const [needsName, setNeedsName] = useState(false)
  const [signUpName, setSignUpName] = useState('')
  const [authMode, setAuthModeState] = useState<AuthMode>('entrar')
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)
  const [recovering, setRecovering] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState(readAuthErrorFromUrl)
  const [notice, setNotice] = useState('')
  const loadedUserId = useRef<string | null>(null)

  const loadAccount = useCallback(
    async (currentSession: Session) => {
      if (!client) return
      if (loadedUserId.current === currentSession.user.id) return
      loadedUserId.current = currentSession.user.id
      setAccountLoading(true)

      try {
        const profile = await fetchProfileName(client, currentSession)
        setFullName(profile.displayName)
        setNeedsName(profile.storedName === null)
      } catch (loadError) {
        loadedUserId.current = null
        setError(messageFromError(loadError))
        throw loadError
      } finally {
        setAccountLoading(false)
      }
    },
    [client],
  )

  useEffect(() => {
    clearAuthErrorFromUrl()
  }, [])

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  useEffect(() => {
    if (!client) return
    let mounted = true

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)

      if (event === 'PASSWORD_RECOVERY') setRecovering(true)

      if (!nextSession) {
        loadedUserId.current = null
        setFullName('')
        setNeedsName(false)
        setRecovering(false)
        setPassword('')
        return
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION' ||
        event === 'PASSWORD_RECOVERY'
      ) {
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
        if (mounted) setError(authErrorMessage(loadError))
      })
      .finally(() => {
        if (mounted) setStarting(false)
      })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [client, loadAccount])

  function setAuthMode(mode: AuthMode) {
    setAuthModeState(mode)
    setError('')
    setNotice('')
    setLinkSentTo(null)
    setPassword('')
  }

  function begin() {
    setBusy('auth')
    setError('')
    setNotice('')
  }

  async function requestMagicLink(address: string) {
    if (!client) return
    begin()

    try {
      await sendMagicLink(client, address)
      setLinkSentTo(address)
      setResendIn(RESEND_SECONDS)
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setBusy('')
    }
  }

  function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    return requestMagicLink(email.trim())
  }

  function handleResendMagicLink() {
    if (!linkSentTo || resendIn > 0) return Promise.resolve()
    return requestMagicLink(linkSentTo)
  }

  async function handleGoogle() {
    if (!client) return
    begin()

    try {
      await signInWithGoogle(client)
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setBusy('')
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    begin()

    try {
      const nextSession = await signInAccount(client, email.trim(), password)
      setSession(nextSession)
      setPassword('')
      await loadAccount(nextSession)
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setBusy('')
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    begin()

    try {
      const nextSession = await signUpAccount(
        client,
        email.trim(),
        password,
        signUpName.trim(),
      )
      setPassword('')
      setSignUpName('')

      if (nextSession) {
        setSession(nextSession)
        await loadAccount(nextSession)
        setNotice('Cuenta creada.')
      } else {
        setAuthModeState('clave')
        setNotice(
          'Cuenta creada. Te mandamos un correo: tocá el enlace para confirmarla y después iniciá sesión.',
        )
      }
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setBusy('')
    }
  }

  async function handleRecover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) return
    begin()

    try {
      await sendPasswordReset(client, email.trim())
      setNotice(
        'Listo. Si ese correo tiene una cuenta, te mandamos un enlace para elegir una contraseña nueva. Mirá también en Spam.',
      )
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setBusy('')
    }
  }

  async function handleUpdatePassword(newPassword: string) {
    if (!client) return
    begin()

    try {
      await updateAccountPassword(client, newPassword)
      setRecovering(false)
      setNotice('Contraseña actualizada.')
    } catch (authError) {
      setError(authErrorMessage(authError))
    } finally {
      setBusy('')
    }
  }

  async function handleSaveName(name: string) {
    if (!client || !session) return
    begin()

    try {
      const trimmed = name.trim()
      await saveProfileName(client, session.user.id, trimmed)
      setFullName(trimmed)
      setNeedsName(false)
    } catch (saveError) {
      setError(messageFromError(saveError))
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
      setError(authErrorMessage(authError))
    } finally {
      setBusy('')
    }
  }

  const isDebugAdmin = session?.user.app_metadata.debug_admin === true

  return {
    client,
    configurationError,
    session,
    fullName,
    needsName,
    recovering,
    welcomeName:
      fullName.trim().split(' ')[0] ||
      session?.user.email?.split('@')[0] ||
      'ahí',
    starting,
    accountLoading,
    email,
    setEmail,
    password,
    setPassword,
    fullNameInput: signUpName,
    setFullName: setSignUpName,
    authMode,
    setAuthMode,
    linkSentTo,
    resendIn,
    busy,
    error,
    setError,
    notice,
    setNotice,
    isDebugAdmin,
    handleSignIn,
    handleSignUp,
    handleMagicLink,
    handleResendMagicLink,
    handleGoogle,
    handleRecover,
    handleUpdatePassword,
    handleSaveName,
    handleSignOut,
  }
}
