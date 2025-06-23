import { z } from 'zod'

export const createTransactionSchema = z
  .object({
    payer_id: z.string().min(1, 'ID do pagador é obrigatório').trim(),
    receiver_id: z.string().min(1, 'ID do recebedor é obrigatório').trim(),
    amount: z
      .number()
      .positive('Valor deve ser um número positivo')
      .min(0.01, 'Valor deve ser maior que zero'),
    description: z
      .string()
      .max(500, 'Descrição deve ter no máximo 500 caracteres')
      .optional(),
  })
  .refine((data) => data.payer_id !== data.receiver_id, {
    message: 'Pagador e recebedor não podem ser o mesmo',
    path: ['receiver_id'],
  })

export const transactionIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório').trim(),
})

export const webhookSchema = z.object({
  transaction_id: z.string().min(1, 'ID da transação é obrigatório'),
  status: z.enum(['approved', 'failed', 'pending'], {
    errorMap: () => ({
      message: 'Status deve ser approved, failed ou pending',
    }),
  }),
  amount: z.number().positive('Valor deve ser um número positivo'),
  timestamp: z
    .string()
    .datetime('Timestamp deve ser uma data válida')
    .optional(),
  metadata: z.record(z.any()).optional(),
})

export const idempotencyHeaderSchema = z.object({
  'idempotency-key': z
    .string()
    .min(1, 'Chave de idempotência é obrigatória')
    .max(255, 'Chave de idempotência deve ter no máximo 255 caracteres'),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type TransactionIdInput = z.infer<typeof transactionIdSchema>
export type WebhookInput = z.infer<typeof webhookSchema>
export type IdempotencyHeaderInput = z.infer<typeof idempotencyHeaderSchema>
