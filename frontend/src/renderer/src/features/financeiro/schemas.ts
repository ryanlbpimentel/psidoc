import { z } from 'zod'
import { parseMoney } from './lib/format'

export const pacoteSchema = z.object({
  quantidade: z
    .string()
    .trim()
    .min(1, 'Informe a quantidade de sessões.')
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, 'Informe um número inteiro maior que zero.'),
  valor: z
    .string()
    .min(1, 'Informe o valor total do pacote.')
    .refine((v) => parseMoney(v) > 0, 'O valor deve ser maior que zero.')
})

export type PacoteValues = z.infer<typeof pacoteSchema>
