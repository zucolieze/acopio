import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let supabaseClient: ReturnType<typeof createClient<Database>> | undefined

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Configuralas en seguimiento-acopio/.env.local.',
    )
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}
