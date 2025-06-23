import { NextFunction, Request, Response } from 'express'

interface SuccessResponse<T = unknown> {
  success: true
  data: T
  timestamp: string
  path: string
}

export const responseHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.success = function <T>(data: T, statusCode = 200): Response {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    }

    return this.status(statusCode).json(response)
  }

  next()
}
