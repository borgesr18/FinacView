import { createClient } from "@supabase/supabase-js"

function getBearer(req: Request) {
  const auth = req.headers.get("authorization") || ""
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim()
  return ""
}

export function supabaseRouteClient(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const token = getBearer(req)
  if (!url || !anon) throw new Error("Supabase public env vars missing")
  const client = createClient(url, anon, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
  return client
}

export async function getClinicaIdForUser(client: ReturnType<typeof createClient>) {
  const { data, error } = await client
    .from("perfis_usuarios")
    .select("clinica_id")
    .limit(1)
    .single()
  if (error) return { clinicaId: null, error }
  return { clinicaId: (data as any)?.clinica_id as string | null, error: null }
}
