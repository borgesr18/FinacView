import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { Client } from "pg"

const dbUrl = process.env.DATABASE_URL || ""

describe.skipIf(!dbUrl)("RLS isolation by clinica_id", () => {
  let client: Client
  let clinicA: string
  let clinicB: string
  let userA: string
  let userB: string
  let pacienteA: string
  let pacienteB: string

  beforeAll(async () => {
    client = new Client({ connectionString: dbUrl })
    await client.connect()
    await client.query("begin")
    const { rows: [{ id: ca }] } = await client.query(`insert into clinicas (nome) values ('RLS Clinica A') returning id`)
    clinicA = ca
    const { rows: [{ id: cb }] } = await client.query(`insert into clinicas (nome) values ('RLS Clinica B') returning id`)
    clinicB = cb

    const { rows: [{ id: ua }] } = await client.query(`select gen_random_uuid() as id`)
    userA = ua
    const { rows: [{ id: ub }] } = await client.query(`select gen_random_uuid() as id`)
    userB = ub

    await client.query(`insert into perfis_usuarios (user_id, clinica_id, nome, role) values ($1,$2,'User A','ADMIN')`, [userA, clinicA])
    await client.query(`insert into perfis_usuarios (user_id, clinica_id, nome, role) values ($1,$2,'User B','ADMIN')`, [userB, clinicB])

    const { rows: [{ id: pa }] } = await client.query(`insert into pacientes (clinica_id, nome) values ($1,'Paciente A') returning id`, [clinicA])
    pacienteA = pa
    const { rows: [{ id: pb }] } = await client.query(`insert into pacientes (clinica_id, nome) values ($1,'Paciente B') returning id`, [clinicB])
    pacienteB = pb
  })

  afterAll(async () => {
    await client.query("rollback")
    await client.end()
  })

  it("userA sees only clinicA data", async () => {
    await client.query(`set local request.jwt.claim.sub = $1`, [userA])
    const { rows } = await client.query(`select id from pacientes order by id`)
    const ids = rows.map(r => r.id)
    expect(ids).toContain(pacienteA)
    expect(ids).not.toContain(pacienteB)
  })

  it("userB sees only clinicB data", async () => {
    await client.query(`set local request.jwt.claim.sub = $1`, [userB])
    const { rows } = await client.query(`select id from pacientes order by id`)
    const ids = rows.map(r => r.id)
    expect(ids).toContain(pacienteB)
    expect(ids).not.toContain(pacienteA)
  })
})
