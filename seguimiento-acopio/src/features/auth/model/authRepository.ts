import type { Session, SupabaseClient } from '@supabase/supabase-js'
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
  if (error) throw error
}
