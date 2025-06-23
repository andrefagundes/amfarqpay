import { z } from 'zod'

export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z.string().email('Email deve ser válido').toLowerCase().trim(),
  balance: z.number().min(0, 'Saldo deve ser um número positivo'),
})

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Email deve ser válido')
    .toLowerCase()
    .trim()
    .optional(),
  balance: z.number().min(0, 'Saldo deve ser um número positivo').optional(),
})

export const userIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório').trim(),
})

export const userParamSchema = z.object({
  user_id: z.string().min(1, 'ID do usuário é obrigatório').trim(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserIdInput = z.infer<typeof userIdSchema>
export type UserParamInput = z.infer<typeof userParamSchema>
