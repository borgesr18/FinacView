import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import * as XLSX from "xlsx"
import { createClient } from "@supabase/supabase-js"
import { env } from "./utils/env"

export type EtlMode = "dry" | "commit"
type BasicCounts = { inserted: number; updated: number; skipped: number; errors: number }
export type EtlReport = {
  mode: EtlMode
  file: string
  startedAt: string
  finishedAt?: string
  sheets: string[]
  pacientes: BasicCounts & { inconsistencies: any[] }
  planos: BasicCounts & { inconsistencies: any[] }
  matriculas: BasicCounts & { inconsistencies: any[] }
  faturas: BasicCounts & { inconsistencies: any[] }
  pagamentos: BasicCounts & { inconsistencies: any[] }
  atendimentos: BasicCounts & { inconsistencies: any[] }
  errors: string[]
}

function parseArgs() {
  const args = process.argv.slice(2)
  const isDry = args.includes("--dry")
  const isCommit = args.includes("--commit")
  const fileIdx = args.findIndex((a) => a === "--file")
  const file = fileIdx >= 0 ? args[fileIdx + 1] : undefined
  if (!isDry && !isCommit) {
    console.error("Use --dry or --commit")
    process.exit(1)
  }
  if (!file) {
    console.error("Use --file <path>")
    process.exit(1)
  }
  const mode: EtlMode = isDry ? "dry" : "commit"
  return { mode, file }
}

function readWorkbook(file: string) {
  const wb = XLSX.readFile(file, { cellDates: true })
  return wb
}

function toDateIso(d: any, defaultTime = "00:00:00Z") {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return null
  const s = date.toISOString().slice(0, 10)
  return `${s}T${defaultTime}`
}

function normalizeName(s: any) {
  if (!s || typeof s !== "string") return ""
  return s.replace(/\s+/g, " ").trim()
}

function parsePlano(s: any) {
  const str = String(s || "").toUpperCase()
  const m = str.match(/(\d+)X\s*-\s*(MENSAL|TRIMESTRAL|SEMESTRAL|ANUAL)/i)
  if (!m) return null
  const freq = Number(m[1])
  const periodicidade = m[2].toUpperCase()
  const nome = `${freq}x/semana - ${periodicidade}`
  return { modalidade: "PILATES", frequencia_semana: freq, periodicidade, nome }
}

function parseNumberPtBr(v: any) {
  if (typeof v === "number") return v
  if (!v || typeof v !== "string") return null
  const s = v.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")
  const n = Number(s)
  return isNaN(n) ? null : n
}

function mapPagamentoMetodo(s: any) {
  const str = String(s || "").toUpperCase()
  if (str.includes("PIX")) return "PIX"
  if (str.includes("ESP")) return "ESPECIE"
  if (str.includes("CART")) return "CARTAO"
  if (str.includes("TRANSF") || str.includes("TED") || str.includes("DOC")) return "TRANSFERENCIA"
  return "PIX"
}

function competenciaFromYm(ym: string) {
  const [y, m] = ym.split("-").map((x) => Number(x))
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1))
  return d.toISOString().slice(0, 10)
}

function hashId(...parts: string[]) {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex")
}

async function withSupabase() {
  if (!env.supabaseUrl || !env.supabaseService) {
    throw new Error("Supabase env not configured")
  }
  const client = createClient(env.supabaseUrl, env.supabaseService)
  return client
}

async function ensureDefaultClinic(client: any) {
  const name = env.defaultClinicName || "Clínica Exemplo"
  const { data, error } = await client.from("clinicas").select("id").eq("nome", name).maybeSingle()
  if (error) throw error
  if (data?.id) return data.id
  const ins = await client.from("clinicas").insert({ nome: name }).select("id").single()
  if (ins.error) throw ins.error
  return ins.data.id
}

export async function runEtl(mode: EtlMode, file: string) {
  const reportDir = path.join("scripts", "reports")
  fs.mkdirSync(reportDir, { recursive: true })
  const ts = Date.now()
  const reportPath = path.join(reportDir, `etl-${ts}.json`)

  const report: EtlReport = {
    mode,
    file,
    startedAt: new Date().toISOString(),
    sheets: [],
    pacientes: { inserted: 0, updated: 0, skipped: 0, errors: 0, inconsistencies: [] },
    planos: { inserted: 0, updated: 0, skipped: 0, errors: 0, inconsistencies: [] },
    matriculas: { inserted: 0, updated: 0, skipped: 0, errors: 0, inconsistencies: [] },
    faturas: { inserted: 0, updated: 0, skipped: 0, errors: 0, inconsistencies: [] },
    pagamentos: { inserted: 0, updated: 0, skipped: 0, errors: 0, inconsistencies: [] },
    atendimentos: { inserted: 0, updated: 0, skipped: 0, errors: 0, inconsistencies: [] },
    errors: []
  }

  try {
    const wb = readWorkbook(file)
    report.sheets = wb.SheetNames.slice()
    const listaMatSheet = wb.Sheets[wb.SheetNames.find((n) => n.toUpperCase().includes("MATR")) || wb.SheetNames[0]]
    const atendConsultSheet = wb.Sheets[wb.SheetNames.find((n) => n.toUpperCase().includes("ATEND")) || ""]
    const faturamentoSheet = wb.Sheets[wb.SheetNames.find((n) => n.toUpperCase().includes("FATUR")) || ""]

    const rowsMat = listaMatSheet ? XLSX.utils.sheet_to_json<any>(listaMatSheet, { defval: null }) : []
    const rowsAt = atendConsultSheet ? XLSX.utils.sheet_to_json<any>(atendConsultSheet, { defval: null }) : []
    const rowsFat = faturamentoSheet ? XLSX.utils.sheet_to_json<any>(faturamentoSheet, { defval: null }) : []

    let client: any = null
    let clinicaId: string | null = null
    if (mode === "commit") {
      client = await withSupabase()
      clinicaId = await ensureDefaultClinic(client)
    }

    const pacientesMap = new Map<string, string>()
    for (const r of rowsMat) {
      const nome = normalizeName(r["NOME"] || r["Nome"] || r["nome"])
      if (!nome) {
        report.pacientes.skipped++
        report.pacientes.inconsistencies.push({ reason: "missing_nome", row: r })
        continue
      }
      if (pacientesMap.has(nome)) continue
      if (mode === "dry") {
        pacientesMap.set(nome, `dry-${hashId(nome)}`)
        report.pacientes.inserted++
      } else {
        const sel = await client.from("pacientes").select("id").eq("clinica_id", clinicaId).eq("nome", nome).maybeSingle()
        if (sel.error) {
          report.pacientes.errors++
          report.pacientes.inconsistencies.push({ reason: "select_error", nome, error: sel.error.message })
          continue
        }
        if (sel.data?.id) {
          pacientesMap.set(nome, sel.data.id)
          report.pacientes.skipped++
        } else {
          const ins = await client.from("pacientes").insert({ clinica_id: clinicaId, nome }).select("id").single()
          if (ins.error) {
            report.pacientes.errors++
            report.pacientes.inconsistencies.push({ reason: "insert_error", nome, error: ins.error.message })
          } else {
            pacientesMap.set(nome, ins.data.id)
            report.pacientes.inserted++
          }
        }
      }
    }

    const planosMap = new Map<string, string>()
    for (const r of rowsMat) {
      const planoRaw = r["PLANO"] ?? r["Plano"]
      const parsed = parsePlano(planoRaw)
      if (!parsed) {
        report.planos.skipped++
        report.planos.inconsistencies.push({ reason: "invalid_plano", value: planoRaw })
        continue
      }
      const key = `${parsed.nome}|${parsed.modalidade}`
      if (planosMap.has(key)) continue
      if (mode === "dry") {
        planosMap.set(key, `dry-${hashId(key)}`)
        report.planos.inserted++
      } else {
        const sel = await client
          .from("planos")
          .select("id")
          .eq("clinica_id", clinicaId)
          .eq("nome", parsed.nome)
          .eq("modalidade", parsed.modalidade)
          .maybeSingle()
        if (sel.error) {
          report.planos.errors++
          report.planos.inconsistencies.push({ reason: "select_error", key, error: sel.error.message })
          continue
        }
        if (sel.data?.id) {
          planosMap.set(key, sel.data.id)
          report.planos.skipped++
        } else {
          const ins = await client
            .from("planos")
            .insert({
              clinica_id: clinicaId,
              nome: parsed.nome,
              modalidade: parsed.modalidade,
              frequencia_semana: parsed.frequencia_semana,
              periodicidade: parsed.periodicidade,
              ativo: true
            })
            .select("id")
            .single()
          if (ins.error) {
            report.planos.errors++
            report.planos.inconsistencies.push({ reason: "insert_error", key, error: ins.error.message })
          } else {
            planosMap.set(key, ins.data.id)
            report.planos.inserted++
          }
        }
      }
    }

    const matriculasIdxByNome = new Map<string, string>()
    for (const r of rowsMat) {
      const nome = normalizeName(r["NOME"] || r["Nome"] || r["nome"])
      if (!nome) continue
      const pacienteId = pacientesMap.get(nome)
      const planoParsed = parsePlano(r["PLANO"] ?? r["Plano"])
      const planoKey = planoParsed ? `${planoParsed.nome}|${planoParsed.modalidade}` : ""
      const planoId = planosMap.get(planoKey)
      if (!pacienteId || !planoId) {
        report.matriculas.skipped++
        report.matriculas.inconsistencies.push({ reason: "missing_paciente_or_plano", nome, plano: planoKey })
        continue
      }
      const dataInicio = toDateIso(r["DATA INÍCIO"] || r["DATA INICIO"] || r["Data Início"] || r["Inicio"])
      const dataTerminoDate = toDateIso(r["DATA TÉRMINO"] || r["DATA TERMINO"] || r["Data Término"] || r["Termino"])
      const valorMensal = parseNumberPtBr(r["VALOR MENSAL. DESC."] ?? r["VALOR MENSAL"] ?? r["VALOR MENSALIDADE"])
      const valorPacote = parseNumberPtBr(r["VALOR FINAL"] ?? r["VALOR TOTAL"])
      const formaPag = mapPagamentoMetodo(r["FORMA DE PAGAMENTO"] ?? r["Forma de Pagamento"])
      let status = "ATIVA"
      if (dataTerminoDate) {
        const dt = new Date(dataTerminoDate)
        status = dt.getTime() >= Date.now() ? "ATIVA" : "ENCERRADA"
      }
      if (mode === "dry") {
        const mid = `dry-${hashId(nome, planoKey, String(dataInicio || ""))}`
        matriculasIdxByNome.set(nome, mid)
        report.matriculas.inserted++
      } else {
        const sel = await client
          .from("matriculas")
          .select("id")
          .eq("clinica_id", clinicaId)
          .eq("paciente_id", pacienteId)
          .eq("plano_id", planoId)
          .maybeSingle()
        if (sel.error) {
          report.matriculas.errors++
          report.matriculas.inconsistencies.push({ reason: "select_error", nome, error: sel.error.message })
          continue
        }
        if (sel.data?.id) {
          matriculasIdxByNome.set(nome, sel.data.id)
          report.matriculas.skipped++
        } else {
          const ins = await client
            .from("matriculas")
            .insert({
              clinica_id: clinicaId,
              paciente_id: pacienteId,
              plano_id: planoId,
              data_inicio: dataInicio ? dataInicio.slice(0, 10) : null,
              data_termino: dataTerminoDate ? dataTerminoDate.slice(0, 10) : null,
              valor_mensal: valorMensal ?? null,
              valor_pacote: valorPacote ?? null,
              forma_pagamento_preferida: formaPag,
              status
            })
            .select("id")
            .single()
          if (ins.error) {
            report.matriculas.errors++
            report.matriculas.inconsistencies.push({ reason: "insert_error", nome, error: ins.error.message })
          } else {
            matriculasIdxByNome.set(nome, ins.data.id)
            report.matriculas.inserted++
          }
        }
      }
    }

    const monthCols: string[] = Array.isArray(rowsFat) && rowsFat.length
      ? Object.keys(rowsFat[0]).filter((k) => /^\d{4}-\d{2}$/.test(String(k)))
      : []
    for (const r of rowsFat) {
      const nome = normalizeName(r["NOME"] || r["Nome"] || r["nome"])
      if (!nome) continue
      const mid = matriculasIdxByNome.get(nome)
      for (const col of monthCols) {
        const cell = r[col]
        const valor = parseNumberPtBr(cell)
        if (valor === null || Number(valor) <= 0) continue
        const competencia = competenciaFromYm(col)
        const vencimento = (() => {
          const d = new Date(competencia + "T00:00:00Z")
          d.setUTCDate(Math.min(env.billingDueDay || 5, 28))
          return d.toISOString().slice(0, 10)
        })()
        if (mode === "dry") {
          report.faturas.inserted++
          report.pagamentos.inserted++
        } else {
          if (!mid) {
            report.faturas.skipped++
            report.pagamentos.skipped++
            report.pagamentos.inconsistencies.push({ reason: "matricula_not_found", nome, competencia })
            continue
          }
          const upF = await client
            .from("faturas")
            .upsert(
              {
                clinica_id: clinicaId,
                matricula_id: mid,
                competencia,
                valor,
                vencimento,
                status: "ABERTA"
              },
              { onConflict: "matricula_id,competencia" }
            )
            .select("id, status")
            .single()
          if (upF.error) {
            report.faturas.errors++
            report.faturas.inconsistencies.push({ reason: "upsert_error", nome, competencia, error: upF.error.message })
            continue
          }
          const faturaId = upF.data.id
          const payIns = await client
            .from("pagamentos")
            .insert({
              clinica_id: clinicaId,
              fatura_id: faturaId,
              data_pagamento: `${competencia.slice(0, 7)}-${String(env.billingDueDay || 5).padStart(2, "0")}`,
              valor,
              metodo: "PIX"
            })
          if (payIns.error) {
            report.pagamentos.errors++
            report.pagamentos.inconsistencies.push({ reason: "pag_insert_error", nome, competencia, error: payIns.error.message })
          } else {
            report.pagamentos.inserted++
          }
        }
      }
    }

    if (rowsAt && rowsAt.length) {
      const dateFields = Object.keys(rowsAt[0] || {}).filter((k) => /^\d+(\.\d+)?$/.test(String(k)) || /col/i.test(String(k)))
      for (const r of rowsAt) {
        const nome = normalizeName(r["NOME"] || r["Nome"] || r["nome"])
        if (!nome) continue
        const mid = matriculasIdxByNome.get(nome)
        for (const df of Object.keys(r)) {
          if (!/^\d/.test(df) && !/^\d{4}-\d{2}-\d{2}$/.test(df)) continue
          const val = r[df]
          if (!val) continue
          const txt = String(val).toUpperCase()
          let status = "REALIZADO"
          if (txt.includes("REMARC")) status = "REMARCADO"
          else if (txt.includes("FALTOU")) status = "FALTOU"
          const date = toDateIso(val, "09:00:00Z") || (toDateIso(df, "09:00:00Z") as any)
          if (!date) continue
          if (mode === "dry") {
            report.atendimentos.inserted++
          } else {
            if (!mid) {
              report.atendimentos.skipped++
              report.atendimentos.inconsistencies.push({ reason: "matricula_not_found", nome, date })
              continue
            }
            const ins = await client
              .from("atendimentos")
              .insert({
                clinica_id: clinicaId,
                matricula_id: mid,
                data: date,
                tipo: "CONSULTORIO",
                status,
                profissional: null,
                observacoes: null
              })
            if (ins.error) {
              report.atendimentos.errors++
              report.atendimentos.inconsistencies.push({ reason: "insert_error", nome, date, error: ins.error.message })
            } else {
              report.atendimentos.inserted++
            }
          }
        }
      }
    }

    report.finishedAt = new Date().toISOString()
  } catch (e: any) {
    report.errors.push(e?.message || String(e))
  }

  fs.mkdirSync(reportDir, { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  return { report, reportPath }
}

async function main() {
  const { mode, file } = parseArgs()
  try {
    const { report, reportPath } = await runEtl(mode, file)
    console.log(`ETL ${report.mode} completed. Report: ${reportPath}`)
    if (report.errors.length) process.exit(1)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

if (typeof require !== "undefined" && (require as any).main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main()
}
