import {
  isAuthError,
  isAuthRetryableFetchError,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js'
import type { Database } from '../../../lib/database.types'

type Client = SupabaseClient<Database>

const appUrl = () => window.location.origin

export async function fetchProfileName(client: Client, session: Session) {
  const { data, error } = await client
    .from('profiles')
    .select('full_name')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) throw error

  const storedName = data?.full_name?.trim() || null
  return {
    storedName,
    displayName:
      storedName ??
      session.user.user_metadata.full_name ??
      session.user.email?.split('@')[0] ??
      '',
  }
}

export async function saveProfileName(
  client: Client,
  userId: string,
  fullName: string,
) {
  const { error } = await client
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId)

  if (error) throw error
}

export async function signIn(
  client: Client,
  email: string,
  password: string,
) {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  if (!data.session) {
    throw new Error('No se pudo iniciar la sesión. Verificá el correo y la contraseña.')
  }

  return data.session
}

export async function signUp(
  client: Client,
  email: string,
  password: string,
  fullName: string,
) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: appUrl() },
  })

  if (error) throw error
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('Ya existe una cuenta con ese correo. Iniciá sesión.')
  }
  if (!data.session) return null

  await saveProfileName(client, data.session.user.id, fullName)

  return data.session
}

export async function sendMagicLink(client: Client, email: string) {
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: appUrl() },
  })
  if (error) throw error
}

export async function signInWithGoogle(client: Client) {
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: appUrl(),
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw error
}

export async function sendPasswordReset(client: Client, email: string) {
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: appUrl(),
  })
  if (error) throw error
}

export async function updatePassword(client: Client, password: string) {
  const { error } = await client.auth.updateUser({ password })
  if (error) throw error
}

export async function signOut(client: Client) {
  const { error } = await client.auth.signOut()
  if (!error) return

  const { error: localError } = await client.auth.signOut({ scope: 'local' })
  if (localError) throw localError
}

const authErrorMessages: Record<string, string> = {
  invalid_credentials: 'El correo o la contraseña no son correctos.',
  email_not_confirmed: 'Confirmá tu correo antes de iniciar sesión.',
  user_already_exists: 'Ya existe una cuenta con ese correo. Iniciá sesión.',
  email_exists: 'Ya existe una cuenta con ese correo. Iniciá sesión.',
  weak_password: 'La contraseña es muy débil. Usá al menos 8 caracteres.',
  same_password: 'Elegí una contraseña distinta de la anterior.',
  signup_disabled: 'El registro de cuentas nuevas está deshabilitado.',
  validation_failed: 'Revisá que el correo y la contraseña sean válidos.',
  otp_expired: 'El enlace venció o ya se usó. Pedí uno nuevo.',
  over_request_rate_limit: 'Hiciste demasiados intentos. Esperá un momento y probá de nuevo.',
  over_email_send_rate_limit: 'Ya te mandamos un correo hace instantes. Esperá un minuto antes de pedir otro.',
  user_banned: 'Esta cuenta está suspendida.',
  provider_disabled: 'Entrar con Google todavía no está disponible.',
}

export function authErrorMessage(error: unknown) {
  if (isAuthRetryableFetchError(error)) {
    return 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo.'
  }

  if (isAuthError(error)) {
    const known = error.code ? authErrorMessages[error.code] : undefined
    if (known) return known
    if (error.status === 429) return authErrorMessages.over_request_rate_limit
  }

  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado. Probá de nuevo.'
}

export function readAuthErrorFromUrl() {
  const params = new URLSearchParams(
    window.location.hash.replace(/^#/, '') || window.location.search,
  )
  const code = params.get('error_code')
  const hasError = params.has('error') || params.has('error_description')
  if (!code && !hasError) return ''

  return (
    (code && authErrorMessages[code]) ||
    'No pudimos completar el ingreso. Probá de nuevo.'
  )
}

export function clearAuthErrorFromUrl() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  if (params.has('error') || params.has('error_code')) {
    window.history.replaceState(null, '', window.location.pathname)
  }
}
