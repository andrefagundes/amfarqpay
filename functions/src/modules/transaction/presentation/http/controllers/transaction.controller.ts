import { Request, Response } from 'express'

import { IUserRepository } from '../../../../user/domain/repositories/user.repository.interface'
import { CreateTransactionUseCase } from '../../../application/use-cases/create-transaction.usecase'
import { GetTransactionUseCase } from '../../../application/use-cases/get-transaction.usecase'
import { WebhookPaymentGatewayUseCase } from '../../../application/use-cases/webhook-payment-gateway.usecase'
import { ITransactionRepository } from '../../../domain/repositories/transaction.repository.interface'
import { FirestoreWebhookEventRepository } from '../../../infrastructure/database/firestore/webhook-event.repository'

export class TransactionController {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly userRepository: IUserRepository,
    private readonly webhookEventRepository: FirestoreWebhookEventRepository,
  ) {}

  async create(req: Request, res: Response) {
    const useCase = new CreateTransactionUseCase(
      this.transactionRepository,
      this.userRepository,
    )

    const idempotencyKey = req.headers['idempotency-key'] as string
    const result = await useCase.execute({ ...req.body, idempotencyKey })

    res.success(result, 201)
  }

  async getById(req: Request, res: Response) {
    const useCase = new GetTransactionUseCase(this.transactionRepository)
    const result = await useCase.execute(req.params.id)
    res.success(result)
  }

  async handleWebhook(req: Request, res: Response) {
    const useCase = new WebhookPaymentGatewayUseCase(
      this.transactionRepository,
      this.userRepository,
      this.webhookEventRepository,
    )
    await useCase.execute({ ...req.body, rawPayload: req.body })
    res.success({ message: 'Webhook recebido com sucesso' })
  }
}
