import { env } from "./utils/env"
import { Client } from "pg"
import fs from "node:fs"
import path from "node:path"

async function main() {
  const report: any = { ok: false, checks: {}, errors: [] as string[] }
  try {
    if (!env.databaseUrl) {
      throw new Error("DATABASE_URL not set")
    }
    const client = new Client({ connectionString: env.databaseUrl })
    await client.connect()
    report.checks.db_connect = true

    const tables = [
      "clinicas","perfis_usuarios","pacientes","planos","matriculas",
      "faturas","pagamentos","atendimentos","saldos_consultorio"
    ]
    const missingTables: string[] = []
    for (const t of tables) {
      const { rows } = await client.query(
        "select to_regclass($1) as reg", [`public.${t}`]
      )
      if (!rows[0]?.reg) missingTables.push(t)
    }
    report.checks.tables_present = missingTables.length === 0
    if (missingTables.length) report.errors.push(`Missing tables: ${missingTables.join(", ")}`)

    const views = ["vw_receita_mensal","vw_renovacoes_proximas"]
    const missingViews: string[] = []
    for (const v of views) {
      const { rows } = await client.query(
        "select 1 from pg_views where schemaname='public' and viewname=$1", [v]
      )
      if (!rows.length) missingViews.push(v)
    }
    report.checks.views_present = missingViews.length === 0
    if (missingViews.length) report.errors.push(`Missing views: ${missingViews.join(", ")}`)

    const functions = [
      { schema: "auth", name: "clinica_id" },
      { schema: "public", name: "reconciliar_fatura" },
      { schema: "public", name: "trg_pagamentos_reconcile" },
      { schema: "public", name: "trg_atendimentos_consultorio_saldo" }
    ]
    const missingFns: string[] = []
    for (const f of functions) {
      const { rows } = await client.query(
        "select 1 from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname=$1 and p.proname=$2",
        [f.schema, f.name]
      )
      if (!rows.length) missingFns.push(`${f.schema}.${f.name}`)
    }
    report.checks.functions_present = missingFns.length === 0
    if (missingFns.length) report.errors.push(`Missing functions: ${missingFns.join(", ")}`)

    const triggers = [
      { table: "pagamentos", name: "pagamentos_reconcile_aiud" },
      { table: "atendimentos", name: "atendimentos_consultorio_realizado_ai" }
    ]
    const missingTrg: string[] = []
    for (const tr of triggers) {
      const { rows } = await client.query(
        "select 1 from pg_trigger where not tgisinternal and tgname=$1",
        [tr.name]
      )
      if (!rows.length) missingTrg.push(`${tr.table}:${tr.name}`)
    }
    report.checks.triggers_present = missingTrg.length === 0
    if (missingTrg.length) report.errors.push(`Missing triggers: ${missingTrg.join(", ")}`)

    const rlsTables = tables
    const rlsOff: string[] = []
    for (const t of rlsTables) {
      const { rows } = await client.query(
        "select relrowsecurity from pg_class where relname=$1",
        [t]
      )
      if (!rows.length || rows[0].relrowsecurity !== true) rlsOff.push(t)
    }
    report.checks.rls_enabled = rlsOff.length === 0
    if (rlsOff.length) report.errors.push(`RLS disabled: ${rlsOff.join(", ")}`)

    report.ok = report.errors.length === 0
    await client.end()
  } catch (e: any) {
    report.errors.push(e?.message || String(e))
  }

  const outDir = path.join("scripts","reports")
  fs.mkdirSync(outDir, { recursive: true })
  const out = path.join(outDir, `healthcheck-${Date.now()}.json`)
  fs.writeFileSync(out, JSON.stringify(report, null, 2))
  console.log(`Healthcheck report written to ${out}`)
  if (!report.ok) process.exit(1)
}
main()
