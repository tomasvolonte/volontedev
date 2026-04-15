import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente público — para el navegador (respeta RLS)
// Se inicializa lazy para no fallar cuando las env vars están vacías (build time)
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// Alias para uso en cliente (componentes React)
export const supabase = {
  get client() { return getSupabase() },
}

// Cliente admin — solo en Server / API Routes (bypasea RLS)
// Nunca exponer SUPABASE_SERVICE_ROLE_KEY al browser
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role env vars not set')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
