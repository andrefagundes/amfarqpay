import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
  TransactionStatusError,
  UnauthorizedError,
} from '../errors'

interface ErrorResponse {
  success: false
  error: {
    message: string
    code: string
    statusCode: number
    details?: string[]
  }
  timestamp: string
  path: string
}

interface MongoError extends Error {
  code?: number
}

interface ErrorMapping {
  statusCode: number
  errorCode: string
  message: string | ((error: Error) => string)
  getDetails?: (error: Error) => string[] | undefined
}

type ErrorConstructor = new (...args: never[]) => Error

const errorMappings = new Map<string | ErrorConstructor, ErrorMapping>()

errorMappings.set(BadRequestError, {
  statusCode: 400,
  errorCode: 'BAD_REQUEST',
  message: (error: Error) => error.message,
})

errorMappings.set(UnauthorizedError, {
  statusCode: 401,
  errorCode: 'UNAUTHORIZED',
  message: (error: Error) => error.message,
})

errorMappings.set(ForbiddenError, {
  statusCode: 403,
  errorCode: 'FORBIDDEN',
  message: (error: Error) => error.message,
})

errorMappings.set(NotFoundError, {
  statusCode: 404,
  errorCode: 'NOT_FOUND',
  message: (error: Error) => error.message,
})

errorMappings.set(ConflictError, {
  statusCode: 409,
  errorCode: 'CONFLICT',
  message: (error: Error) => error.message,
})

errorMappings.set(RateLimitError, {
  statusCode: 429,
  errorCode: 'RATE_LIMIT_EXCEEDED',
  message: (error: Error) => error.message,
})

errorMappings.set(InternalServerError, {
  statusCode: 500,
  errorCode: 'INTERNAL_SERVER_ERROR',
  message: (error: Error) => error.message,
})

errorMappings.set(ZodError, {
  statusCode: 400,
  errorCode: 'VALIDATION_ERROR',
  message: 'Dados de entrada inválidos',
  getDetails: (error: Error) => {
    if (error instanceof ZodError) {
      return error.errors.map((err) => {
        const field = err.path.join('.')
        return `${field}: ${err.message}`
      })
    }
    return undefined
  },
})

errorMappings.set('ValidationError', {
  statusCode: 400,
  errorCode: 'VALIDATION_ERROR',
  message: 'Dados de entrada inválidos',
})

errorMappings.set('CastError', {
  statusCode: 400,
  errorCode: 'INVALID_ID',
  message: 'ID inválido fornecido',
})

errorMappings.set('MongoError', {
  statusCode: 500,
  errorCode: 'DATABASE_ERROR',
  message: 'Erro no banco de dados',
  getDetails: (error: MongoError) => {
    if (error.code === 11000) {
      return ['Recurso já existe']
    }
    return undefined
  },
})

errorMappings.set('MongoServerError', {
  statusCode: 500,
  errorCode: 'DATABASE_ERROR',
  message: 'Erro no banco de dados',
  getDetails: (error: MongoError) => {
    if (error.code === 11000) {
      return ['Recurso já existe']
    }
    return undefined
  },
})

errorMappings.set(TransactionStatusError, {
  statusCode: 409,
  errorCode: 'TRANSACTION_STATUS_ERROR',
  message: (error: Error) => error.message,
})

export const registerErrorMapping = (
  errorType: string | ErrorConstructor,
  mapping: ErrorMapping,
) => {
  errorMappings.set(errorType, mapping)
}

const getErrorMapping = (error: Error): ErrorMapping => {
  for (const [errorType, mapping] of errorMappings.entries()) {
    if (typeof errorType === 'function' && error instanceof errorType) {
      return mapping
    }
  }

  const nameMapping = errorMappings.get(error.name)
  if (nameMapping) {
    return nameMapping
  }

  return {
    statusCode: 500,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'Erro interno do servidor',
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  })

  const mapping = getErrorMapping(error)

  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    const mongoError = error as MongoError
    if (mongoError.code === 11000) {
      mapping.statusCode = 409
      mapping.errorCode = 'DUPLICATE_KEY'
    }
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message:
        typeof mapping.message === 'function'
          ? mapping.message(error)
          : mapping.message,
      code: mapping.errorCode,
      statusCode: mapping.statusCode,
      ...(mapping.getDetails && { details: mapping.getDetails(error) }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  }

  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json')
    res.status(mapping.statusCode).json(errorResponse)
  }
}
