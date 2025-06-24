import { Router } from 'express'

import { asyncHandler } from '../../../../../shared/middlewares/async-handler'
import { authMiddleware } from '../../../../../shared/middlewares/auth'
import { transactionRateLimiter } from '../../../../../shared/middlewares/rate-limit'
import { validateRequest } from '../../../../../shared/middlewares/zod-validation'
import {
  createTransactionSchema,
  idempotencyHeaderSchema,
  transactionIdSchema,
  webhookSchema,
} from '../../../../../shared/schemas/transaction.schemas'
import { FirestoreUserRepository } from '../../../../user/infrastructure/database/firestore/user.repository'
import { FirestoreTransactionRepository } from '../../../infrastructure/database/firestore/transaction.repository'
import { TransactionController } from '../controllers/transaction.controller'

const router = Router()

const transactionRepository = new FirestoreTransactionRepository()
const userRepository = new FirestoreUserRepository()

const controller = new TransactionController(
  transactionRepository,
  userRepository,
)

router.post(
  '/',
  authMiddleware,
  validateRequest({
    body: createTransactionSchema,
    headers: idempotencyHeaderSchema,
  }),
  transactionRateLimiter,
  asyncHandler(controller.create.bind(controller)),
)

router.get(
  '/:id',
  authMiddleware,
  validateRequest({
    params: transactionIdSchema,
  }),
  asyncHandler(controller.getById.bind(controller)),
)

router.post(
  '/webhook/payment-gateway',
  validateRequest({
    body: webhookSchema,
  }),
  asyncHandler(controller.handleWebhook.bind(controller)),
)

export { router as transactionRoutes }
