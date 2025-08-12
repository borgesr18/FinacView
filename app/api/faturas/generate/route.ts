import { NextResponse } from "next/server"
import { faturasGenerateSchema } from "@/lib/validation/faturas"
import { getClientIp } from "@/lib/http/ip"
import { rateLimit } from "@/lib/security/rateLimit"
import { supabaseRouteClient, getClinicaIdForUser } from "@/lib/supabase/user"

export const runtime = "nodejs"

function parseYearMonth(s: string) {
  const [yRaw, mRaw] = s.split("-")
  const y = Number(yRaw)
  const m = Number(mRaw || "1")
  const competencia = new Date(Date.UTC(y, (m || 1) - 1, 1)).toISOString().slice(0, 10)
  return competencia
}

export async function POST(req: Request) {
  const ip = getClientIp()
  const rl = rateLimit(`faturas:generate:POST:${ip}`, 10, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const parsed = faturasGenerateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 })

  const supabase = supabaseRouteClient(req)
  const { clinicaId, error: clinErr } = await getClinicaIdForUser(supabase)
  if (clinErr || !clinicaId) return NextResponse.json({ error: clinErr?.message || "clinica_not_found" }, { status: 403 })

  const competencia = parseYearMonth(parsed.data.competencia)
  const dueDefault = Number(process.env.BILLING_DUE_DAY || "5")
  const dueDay = parsed.data.dueDay ?? dueDefault
  const dueDate = (() => {
    const d = new Date(competencia + "T00:00:00Z")
    d.setUTCDate(Math.min(dueDay, 28))
    return d.toISOString().slice(0, 10)
  })()

  const onlyAtivas = parsed.data.onlyAtivas ?? true

  const { data: matriculas, error: mErr } = await supabase
    .from("matriculas")
    .select("id, valor_mensal, valor_pacote, status")
    .eq("clinica_id", clinicaId)
    .in("status", onlyAtivas ? ["ATIVA"] as any : ["ATIVA", "PAUSADA"] as any)

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  let created = 0, skipped = 0, failed = 0
  for (const m of matriculas || []) {
    const valor = Number(m.valor_mensal ?? m.valor_pacote ?? 0)
    if (!valor || valor <= 0) { skipped++; continue }

    const { error: insErr } = await supabase
      .from("faturas")
      .upsert({
        clinica_id: clinicaId,
        matricula_id: m.id,
        competencia,
        valor,
        vencimento: dueDate,
        status: "ABERTA"
      }, { onConflict: "matricula_id,competencia", ignoreDuplicates: true })
    if (insErr) { failed++; continue }
    created++
  }

  return NextResponse.json({ created, skipped, failed }, { status: 202 })
}
