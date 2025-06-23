import { Request } from 'express'
import rateLimit from 'express-rate-limit'
import { RateLimitError } from '../errors/rate-limit.error'

export const transactionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler: (req, res, next) => {
    next(new RateLimitError('Limite de transações excedido.'))
  },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const key = req.body?.payer_id || req.user?.id || req.ip || 'unknown'

    return key
  },
  skip: (req: Request): boolean => {
    const fullPath = req.baseUrl + req.path
    return req.method !== 'POST' || !fullPath.includes('/transactions')
  },
})

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  handler: (req, res, next) => {
    next(new RateLimitError('Limite de webhooks excedido.'))
  },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || 'unknown'
  },
  skip: (req: Request): boolean => {
    return !req.path.includes('/webhook')
  },
})
