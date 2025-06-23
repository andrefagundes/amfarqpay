import { Router } from 'express'
import { asyncHandler } from '../../../../../shared/middlewares/async-handler'
import { authMiddleware } from '../../../../../shared/middlewares/auth'
import {
  validateBody,
  validateParams,
} from '../../../../../shared/middlewares/zod-validation'
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  userParamSchema,
} from '../../../../../shared/schemas/user.schemas'
import { FirestoreTransactionRepository } from '../../../../transaction/infrastructure/database/firestore/transaction.repository'
import { FirestoreUserRepository } from '../../../infrastructure/database/firestore/user.repository'
import { UserController } from '../controllers/user.controller'

const router = Router()

const userRepository = new FirestoreUserRepository()
const transactionRepository = new FirestoreTransactionRepository()

const userController = new UserController(userRepository, transactionRepository)

router.post(
  '/',
  authMiddleware,
  validateBody(createUserSchema),
  asyncHandler(userController.create.bind(userController)),
)

router.get(
  '/:id',
  authMiddleware,
  validateParams(userIdSchema),
  asyncHandler(userController.findById.bind(userController)),
)

router.put(
  '/:id',
  authMiddleware,
  validateParams(userIdSchema),
  validateBody(updateUserSchema),
  asyncHandler(userController.update.bind(userController)),
)

router.get(
  '/:user_id/transactions',
  authMiddleware,
  validateParams(userParamSchema),
  asyncHandler(userController.getTransactions.bind(userController)),
)

export { router as userRoutes }
