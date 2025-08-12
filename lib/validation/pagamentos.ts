import { z } from "zod"

export const pagamentoCreateSchema = z.object({
  fatura_id: z.string().uuid(),
  data_pagamento: z.string().datetime().or(z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)).optional(),
  valor: z.number().min(0.01),
  metodo: z.enum(["PIX","ESPECIE","CARTAO","TRANSFERENCIA"]),
  comprovante_url: z.string().url().optional()
})
export type PagamentoCreateInput = z.infer<typeof pagamentoCreateSchema>
