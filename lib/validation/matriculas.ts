import { z } from "zod"

export const matriculaCreateSchema = z.object({
  paciente_id: z.string().uuid(),
  plano_id: z.string().uuid(),
  data_inicio: z.string().datetime().or(z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)),
  data_termino: z.string().datetime().or(z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)).nullable().optional(),
  desconto_percentual: z.number().min(0).max(100).nullable().optional(),
  desconto_valor: z.number().min(0).nullable().optional(),
  valor_mensal: z.number().min(0).nullable().optional(),
  valor_pacote: z.number().min(0).nullable().optional(),
  forma_pagamento_preferida: z.enum(["PIX","ESPECIE","CARTAO","TRANSFERENCIA"]).nullable().optional(),
  status: z.enum(["ATIVA","PAUSADA","ENCERRADA"]).default("ATIVA")
})
export type MatriculaCreateInput = z.infer<typeof matriculaCreateSchema>
