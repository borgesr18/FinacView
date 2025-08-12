import { z } from "zod"

export const pacienteCreateSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(8).optional().nullable(),
  email: z.string().email().optional().nullable(),
  documento: z.string().min(5).optional().nullable()
})

export type PacienteCreateInput = z.infer<typeof pacienteCreateSchema>
