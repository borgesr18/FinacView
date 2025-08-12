import { env } from "./utils/env"
import { Client } from "pg"

function addMonths(d: Date, months: number) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  date.setUTCMonth(date.getUTCMonth() + months)
  return date
}
function ymd(date: Date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
function firstDayOfMonth(year: number, month1to12: number) {
  return new Date(Date.UTC(year, month1to12 - 1, 1))
}

async function main() {
  if (!env.databaseUrl) {
    console.error("DATABASE_URL is not set. Skipping seed.")
    process.exit(1)
  }
  const client = new Client({ connectionString: env.databaseUrl })
  await client.connect()

  const clinics = [
    { nome: "Fácil Pilates – Matriz" },
    { nome: "Fácil Pilates – Unidade 2" }
  ]

  for (const c of clinics) {
    await client.query(
      `insert into clinicas (nome) values ($1) on conflict (nome) do nothing`,
      [c.nome]
    )
  }

  const { rows: clinicas } = await client.query(`select id, nome from clinicas order by nome asc`)
  for (const cl of clinicas) {
    const roles = ["ADMIN","FINANCEIRO","INSTRUTOR","RECEPCAO"]
    const usersToCreate = 10
    for (let i = 1; i <= usersToCreate; i++) {
      const userIdSql = `select gen_random_uuid() as id`
      const { rows: [{ id: userId }] } = await client.query(userIdSql)
      const role = roles[(i - 1) % roles.length]
      await client.query(
        `insert into perfis_usuarios (user_id, clinica_id, nome, role)
         values ($1,$2,$3,$4)
         on conflict (user_id) do nothing`,
        [userId, cl.id, `${role} ${i} (${cl.nome})`, role]
      )
    }

    const plans = [
      { nome: "2x/semana - MENSAL", modalidade: "PILATES", frequencia_semana: 2, periodicidade: "MENSAL", preco_mensal: 300.00 },
      { nome: "3x/semana - MENSAL", modalidade: "PILATES", frequencia_semana: 3, periodicidade: "MENSAL", preco_mensal: 400.00 },
      { nome: "Consultório - Pacote 10", modalidade: "CONSULTORIO", sessoes_inclusas: 10, preco_pacote: 900.00 }
    ]
    for (const p of plans) {
      await client.query(
        `insert into planos (clinica_id, nome, modalidade, frequencia_semana, periodicidade, sessoes_inclusas, preco_mensal, preco_pacote)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict do nothing`,
        [cl.id, p.nome, p.modalidade, p.frequencia_semana ?? null, p.periodicidade ?? null, p.sessoes_inclusas ?? null, p.preco_mensal ?? null, p.preco_pacote ?? null]
      )
    }

    for (let i = 1; i <= 25; i++) {
      await client.query(
        `insert into pacientes (clinica_id, nome, telefone, email)
         values ($1, $2, $3, $4)`,
        [cl.id, `Paciente ${i} (${cl.nome})`, `+55 11 99999-${String(1000+i).slice(-4)}`, `pac${i}@exemplo.com`]
      )
    }

    const { rows: planRows } = await client.query(`select id, nome, preco_mensal from planos where clinica_id=$1`, [cl.id])
    const planPilates2x = planRows.find((p: any) => p.nome.includes("2x/semana"))
    for (let i = 1; i <= 15; i++) {
      const { rows: [pac] } = await client.query(
        `select id from pacientes where clinica_id=$1 and nome=$2 limit 1`,
        [cl.id, `Paciente ${i} (${cl.nome})`]
      )
      if (!pac) continue
      await client.query(
        `insert into matriculas (clinica_id, paciente_id, plano_id, data_inicio, status, valor_mensal)
         values ($1,$2,$3,current_date - interval '12 months','ATIVA', $4)`,
        [cl.id, pac.id, planPilates2x?.id, planPilates2x?.preco_mensal ?? 300.00]
      )
    }

    const { rows: matriculas } = await client.query(
      `select id, valor_mensal from matriculas where clinica_id=$1`,
      [cl.id]
    )

    const today = new Date()
    const start = addMonths(firstDayOfMonth(today.getUTCFullYear(), today.getUTCMonth() + 1), -11) // first day 11 months ago
    for (const m of matriculas) {
      for (let offset = 0; offset < 12; offset++) {
        const compDate = addMonths(start, offset)
        compDate.setUTCDate(1)
        const competencia = ymd(compDate)
        const valor = Number(m.valor_mensal ?? 300)
        const due = new Date(Date.UTC(compDate.getUTCFullYear(), compDate.getUTCMonth(), Math.min(env.billingDueDay || 5, 28)))
        const vencimento = ymd(due)
        const { rows: [ft] } = await client.query(
          `insert into faturas (clinica_id, matricula_id, competencia, valor, vencimento, status)
           values ($1,$2,$3,$4,$5,'ABERTA')
           on conflict (matricula_id, competencia) do update set valor=excluded.valor
           returning id`,
          [cl.id, m.id, competencia, valor, vencimento]
        )
        if ((offset + m.id.length) % 3 !== 0) {
          const payDate = new Date(Date.UTC(compDate.getUTCFullYear(), compDate.getUTCMonth(), Math.min((env.billingDueDay || 5), 28)))
          const data_pagamento = ymd(payDate)
          await client.query(
            `insert into pagamentos (clinica_id, fatura_id, data_pagamento, valor, metodo)
             values ($1,$2,$3,$4,$5)`,
            [cl.id, ft.id, data_pagamento, valor, "PIX"]
          )
        }
      }
    }

    const statuses = ["REALIZADO","REMARCADO","FALTOU"]
    const tipos = ["PILATES","CONSULTORIO"]
    let atendCount = 0
    for (const m of matriculas) {
      for (let k = 0; k < 8; k++) {
        const when = addMonths(today, -Math.floor(Math.random() * 3))
        when.setUTCDate(1 + Math.floor(Math.random() * 27))
        const tipo = tipos[(k + m.id.length) % tipos.length]
        const status = statuses[(k + atendCount) % statuses.length]
        await client.query(
          `insert into atendimentos (clinica_id, matricula_id, data, tipo, status, profissional, observacoes)
           values ($1,$2,$3,$4,$5,$6,$7)`,
          [cl.id, m.id, new Date(when).toISOString(), tipo, status, "Prof. Ana", "Seed"]
        )
        atendCount++
      }
    }
    if (atendCount < 100) {
      const { rows: mats } = await client.query(`select id from matriculas where clinica_id=$1 limit 10`, [cl.id])
      for (let extra = atendCount; extra < 100; extra++) {
        const mat = mats[extra % mats.length]
        const d = addMonths(today, -1)
        d.setUTCDate(1 + (extra % 27))
        await client.query(
          `insert into atendimentos (clinica_id, matricula_id, data, tipo, status, profissional, observacoes)
           values ($1,$2,$3,$4,$5,$6,$7)`,
          [cl.id, mat.id, d.toISOString(), "CONSULTORIO", statuses[extra % statuses.length], "Prof. Bruno", "Seed extra"]
        )
      }
    }
  }

  await client.end()
  console.log("Seed completed.")
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
