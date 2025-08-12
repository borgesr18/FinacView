import { z } from "zod"

export const faturaCreateSchema = z.object({
  matricula_id: z.string().uuid(),
  competencia: z.string().regex(/^\d{4}-\d{2}-01$/),
  valor: z.number().min(0),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["ABERTA","PAGA","ATRASADA"]).default("ABERTA"),
  observacoes: z.string().max(1000).optional()
})
export type FaturaCreateInput = z.infer<typeof faturaCreateSchema>

export const faturasGenerateSchema = z.object({
  competencia: z.string().regex(/^\d{4}-\d{2}$/),
  onlyAtivas: z.boolean().default(true),
  dueDay: z.number().int().min(1).max(28).optional()
})
export type FaturasGenerateInput = z.infer<typeof faturasGenerateSchema>
