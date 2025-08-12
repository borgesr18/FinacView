import { describe, it, expect } from "vitest"
import { pacienteCreateSchema } from "@/lib/validation/schemas"

describe("pacienteCreateSchema", () => {
  it("accepts minimal valid payload", () => {
    const res = pacienteCreateSchema.safeParse({ nome: "Maria" })
    expect(res.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const res = pacienteCreateSchema.safeParse({ nome: "João", email: "bad" })
    expect(res.success).toBe(false)
  })
})
