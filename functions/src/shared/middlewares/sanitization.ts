import { NextFunction, Request, Response } from 'express'

export const sanitizationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body) {
    req.body = sanitizeObject(req.body) as typeof req.body
  }

  if (req.query) {
    req.query = sanitizeObject(req.query) as typeof req.query
  }

  if (req.params) {
    req.params = sanitizeObject(req.params) as typeof req.params
  }

  next()
}

function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }

  return obj
}

function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/expression\(/gi, '')
}
