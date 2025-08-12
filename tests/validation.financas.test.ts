import { describe, it, expect } from "vitest"
import { planoCreateSchema } from "@/lib/validation/planos"
import { matriculaCreateSchema } from "@/lib/validation/matriculas"
import { pagamentoCreateSchema } from "@/lib/validation/pagamentos"
import { faturaCreateSchema, faturasGenerateSchema } from "@/lib/validation/faturas"

describe("planoCreateSchema", () => {
  it("accepts pilates monthly", () => {
    const res = planoCreateSchema.safeParse({ nome: "2x/semana - MENSAL", modalidade: "PILATES", frequencia_semana: 2, periodicidade: "MENSAL" })
    expect(res.success).toBe(true)
  })
})

describe("matriculaCreateSchema", () => {
  it("requires ids", () => {
    const res = matriculaCreateSchema.safeParse({ paciente_id: "not-uuid", plano_id: "also-not", data_inicio: "2025-01-01" })
    expect(res.success).toBe(false)
  })
})

describe("pagamentoCreateSchema", () => {
  it("requires valor > 0", () => {
    const res = pagamentoCreateSchema.safeParse({ fatura_id: "00000000-0000-0000-0000-000000000000", valor: 0, metodo: "PIX" })
    expect(res.success).toBe(false)
  })
})

describe("faturas", () => {
  it("faturaCreateSchema basic", () => {
    const res = faturaCreateSchema.safeParse({
      matricula_id: "00000000-0000-0000-0000-000000000000",
      competencia: "2025-09-01",
      valor: 100,
      vencimento: "2025-09-05",
      status: "ABERTA"
    })
    expect(res.success).toBe(true)
  })

  it("faturasGenerateSchema requires competencia", () => {
    const res = faturasGenerateSchema.safeParse({ competencia: "2025-09" })
    expect(res.success).toBe(true)
  })
})
