import { NextResponse } from "next/server"
import { faturaCreateSchema } from "@/lib/validation/faturas"
import { getClientIp } from "@/lib/http/ip"
import { rateLimit } from "@/lib/security/rateLimit"
import { supabaseRouteClient, getClinicaIdForUser } from "@/lib/supabase/user"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const supabase = supabaseRouteClient(req)
  const { data, error } = await supabase.from("faturas").select("*").order("competencia", { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function POST(req: Request) {
  const ip = getClientIp()
  const rl = rateLimit(`faturas:POST:${ip}`, 20, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const parsed = faturaCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 })

  const supabase = supabaseRouteClient(req)
  const { clinicaId, error: clinErr } = await getClinicaIdForUser(supabase)
  if (clinErr || !clinicaId) return NextResponse.json({ error: clinErr?.message || "clinica_not_found" }, { status: 403 })

  const toInsert = { ...parsed.data, clinica_id: clinicaId }
  const { data, error } = await supabase.from("faturas").insert(toInsert).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
