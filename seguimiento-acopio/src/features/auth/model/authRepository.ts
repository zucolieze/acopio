import {
  isAuthError,
  isAuthRetryableFetchError,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js'
import type { Database } from '../../../lib/database.types'

type Client = SupabaseClient<Database>

export async function fetchFullName(client: Client, session: Session) {
  const { data, error } = await client
    .from('profiles')
    .select('full_name')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) throw error

  return (
    data?.full_name ??
    session.user.user_metadata.full_name ??
    session.user.email?.split('@')[0] ??
    ''
  )
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
    options: { data: { full_name: fullName } },
  })

  if (error) throw error
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('Ya existe una cuenta con ese correo. Iniciá sesión.')
  }
  if (!data.session) return null

  const { error: profileError } = await client
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', data.session.user.id)

  if (profileError) throw profileError

  return data.session
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
  signup_disabled: 'El registro de cuentas nuevas está deshabilitado.',
  validation_failed: 'Revisá que el correo y la contraseña sean válidos.',
  over_request_rate_limit: 'Hiciste demasiados intentos. Esperá un momento y probá de nuevo.',
  over_email_send_rate_limit: 'Se enviaron demasiados correos. Esperá un momento y probá de nuevo.',
  user_banned: 'Esta cuenta está suspendida.',
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
