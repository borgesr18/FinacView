import { env } from "./utils/env"
import { Client } from "pg"

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

    const { rows: planRows } = await client.query(`select id, nome from planos where clinica_id=$1`, [cl.id])
    const planPilates = planRows.find((p: any) => p.nome.includes("2x/semana"))
    for (let i = 1; i <= 15; i++) {
      const { rows: [pac] } = await client.query(
        `select id from pacientes where clinica_id=$1 and nome=$2 limit 1`,
        [cl.id, `Paciente ${i} (${cl.nome})`]
      )
      if (!pac) continue
      await client.query(
        `insert into matriculas (clinica_id, paciente_id, plano_id, data_inicio, status, valor_mensal)
         values ($1,$2,$3,current_date - interval '6 months','ATIVA', 300.00)`,
        [cl.id, pac.id, planPilates?.id]
      )
    }
  }

  await client.end()
  console.log("Seed completed.")
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
