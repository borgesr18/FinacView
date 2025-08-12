import { z } from "zod"

export const planoCreateSchema = z.object({
  nome: z.string().min(2),
  modalidade: z.enum(["PILATES","CONSULTORIO"]),
  frequencia_semana: z.number().int().min(0).max(7).nullable().optional(),
  periodicidade: z.enum(["MENSAL","TRIMESTRAL","SEMESTRAL","ANUAL"]).nullable().optional(),
  sessoes_inclusas: z.number().int().min(0).nullable().optional(),
  preco_mensal: z.number().min(0).nullable().optional(),
  preco_pacote: z.number().min(0).nullable().optional(),
  ativo: z.boolean().default(true)
})
export type PlanoCreateInput = z.infer<typeof planoCreateSchema>
