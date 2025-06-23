import { NextFunction, Request, Response } from 'express'
import { ZodError, ZodType } from 'zod'
import { BadRequestError } from '../errors'

export const validateBody = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.body)
      req.body = validatedData
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((err) => {
            const field = err.path.join('.')
            return `${field}: ${err.message}`
          })
          .join(', ')

        throw new BadRequestError(
          `Dados de entrada inválidos: ${errorMessages}`,
        )
      }
      next(error)
    }
  }
}

export const validateParams = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.params)
      req.params = validatedData
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((err) => {
            const field = err.path.join('.')
            return `${field}: ${err.message}`
          })
          .join(', ')

        throw new BadRequestError(`Parâmetros inválidos: ${errorMessages}`)
      }
      next(error)
    }
  }
}

export const validateQuery = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.query)
      req.query = validatedData
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((err) => {
            const field = err.path.join('.')
            return `${field}: ${err.message}`
          })
          .join(', ')

        throw new BadRequestError(
          `Query parameters inválidos: ${errorMessages}`,
        )
      }
      next(error)
    }
  }
}

export const validateHeaders = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.headers)
      req.headers = { ...req.headers, ...validatedData }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((err) => {
            const field = err.path.join('.')
            return `${field}: ${err.message}`
          })
          .join(', ')

        throw new BadRequestError(`Headers inválidos: ${errorMessages}`)
      }
      next(error)
    }
  }
}

export const validateRequest = (validations: {
  body?: ZodType
  params?: ZodType
  query?: ZodType
  headers?: ZodType
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (validations.body) {
        req.body = await validations.body.parseAsync(req.body)
      }

      if (validations.params) {
        req.params = await validations.params.parseAsync(req.params)
      }

      if (validations.query) {
        req.query = await validations.query.parseAsync(req.query)
      }

      if (validations.headers) {
        const validatedHeaders = await validations.headers.parseAsync(
          req.headers,
        )
        req.headers = { ...req.headers, ...validatedHeaders }
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((err) => {
            const field = err.path.join('.')
            return `${field}: ${err.message}`
          })
          .join(', ')

        throw new BadRequestError(
          `Dados de entrada inválidos: ${errorMessages}`,
        )
      }
      next(error)
    }
  }
}
