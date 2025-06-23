import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../errors'

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autorização é obrigatório')
  }

  const token = authHeader.split(' ')[1]

  req.user = {
    id: token,
  }

  next()
}
