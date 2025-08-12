import { NextResponse } from "next/server"
import { supabaseRouteClient } from "@/lib/supabase/user"

export const runtime = "nodejs"

function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}
function endOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
}

export async function GET(req: Request) {
  const supabase = supabaseRouteClient(req)
  const now = new Date()
  const from = startOfUtcMonth(now).toISOString().slice(0, 10)
  const to = endOfUtcMonth(now).toISOString().slice(0, 10)

  const [{ data: recRows, error: recErr }, { data: ativasRows, error: ativasErr }, { data: renRows, error: renErr }] =
    await Promise.all([
      supabase.from("pagamentos").select("valor, data_pagamento").gte("data_pagamento", from).lte("data_pagamento", to),
      supabase.from("matriculas").select("id").eq("status", "ATIVA"),
      supabase.from("vw_renovacoes_proximas").select("id")
    ])
  if (recErr || ativasErr || renErr) {
    const err = recErr?.message || ativasErr?.message || renErr?.message
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const receitaMes = (recRows || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0)

  const { data: faturasMes, error: mrrErr } = await supabase
    .from("faturas")
    .select("valor, status, competencia")
    .gte("competencia", from)
    .lte("competencia", to)
  if (mrrErr) return NextResponse.json({ error: mrrErr.message }, { status: 500 })
  const mrr = (faturasMes || [])
    .filter((f: any) => f.status === "PAGA" || f.status === "ABERTA")
    .reduce((s: number, f: any) => s + Number(f.valor || 0), 0)

  const { data: atendUlt30, error: atendErr } = await supabase
    .from("atendimentos")
    .select("status, data")
    .gte("data", new Date(Date.now() - 30 * 86400000).toISOString())
  if (atendErr) return NextResponse.json({ error: atendErr.message }, { status: 500 })
  const totalAt = (atendUlt30 || []).length
  const faltou = (atendUlt30 || []).filter((a: any) => a.status === "FALTOU").length
  const noShowRate = totalAt > 0 ? Math.round((faltou / totalAt) * 1000) / 10 : 0

  return NextResponse.json({
    receitaMes,
    mrr,
    matriculasAtivas: (ativasRows || []).length,
    renovacoes30d: (renRows || []).length,
    noShowRate
  })
}
