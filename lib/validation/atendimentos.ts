import { z } from "zod"

export const atendimentoCreateSchema = z.object({
  matricula_id: z.string().uuid(),
  data: z.string().datetime().or(z.string().regex(/^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}(:\\d{2})?Z)?$/)),
  tipo: z.enum(["PILATES","CONSULTORIO"]),
  status: z.enum(["REALIZADO","REMARCADO","FALTOU"]),
  profissional: z.string().min(2).optional(),
  observacoes: z.string().max(1000).optional()
})
export type AtendimentoCreateInput = z.infer<typeof atendimentoCreateSchema>
