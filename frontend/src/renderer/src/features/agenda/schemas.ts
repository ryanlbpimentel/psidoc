import { z } from 'zod'

export const consultaSchema = z.object({
  // Começa nulo (nenhum paciente escolhido). O `: boolean` evita que o TS estreite o tipo e quebre o resolver.
  paciente: z
    .custom<{ id: string; nome: string } | null>()
    .refine((v): boolean => v !== null && v !== undefined, { message: 'Selecione o paciente da consulta.' }),
  data: z.string().min(1, 'Informe a data de início.'),
  hora: z.string().min(1, 'Informe a hora de início.'),
  local: z.string().trim().min(1, 'Informe o local do atendimento.').max(255, 'O local deve ter no máximo 255 caracteres.')
})

export type ConsultaValues = z.infer<typeof consultaSchema>
