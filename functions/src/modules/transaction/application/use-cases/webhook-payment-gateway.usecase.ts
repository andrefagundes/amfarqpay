import {
  TransactionStatus,
  TransactionStatusType,
} from '../../../../shared/constants/transaction-status'
import { BadRequestError } from '../../../../shared/errors/bad-request.error'
import { ConflictError } from '../../../../shared/errors/conflit.error'
import { InternalServerError } from '../../../../shared/errors/internal-server.error'
import { NotFoundError } from '../../../../shared/errors/not-found.error'
import { IUserRepository } from '../../../user/domain/repositories/user.repository.interface'
import { Transaction } from '../../domain/entities/transaction.entity'
import { WebhookEvent } from '../../domain/entities/webhook-event.entity'
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface'
import { IWebhookEventRepository } from '../../domain/repositories/webhook-event.repository.interface'
import { BalanceService } from '../../domain/services/balance.service'

export class WebhookPaymentGatewayUseCase {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly userRepo: IUserRepository,
    private readonly webhookEventRepo: IWebhookEventRepository,
  ) {}

  async execute(input: {
    transaction_id: string
    status: TransactionStatusType
    amount: number
    rawPayload?: any
  }) {
    let logEventType = input.status as string
    try {
      const transaction = await this.transactionRepo.findById(
        input.transaction_id,
      )
      if (!transaction) throw new NotFoundError('Transação não encontrada')

      this.validateTransactionAmount(transaction, input.amount)
      transaction.updateStatus(input.status)

      if (
        transaction.status === TransactionStatus.FAILED &&
        transaction.isAmountDeducted
      ) {
        await this.handleFailedTransaction(transaction)
      }

      if (
        transaction.status === TransactionStatus.APPROVED &&
        transaction.isAmountDeducted
      ) {
        await this.handleApprovedTransaction(transaction)
      }

      await this.transactionRepo.update(transaction)

      await this.webhookEventRepo.log(
        new WebhookEvent(
          null,
          input.rawPayload || input,
          new Date(),
          logEventType,
        ),
      )
    } catch (error: any) {
      logEventType = 'error'
      const errorPayload = {
        ...(input.rawPayload || input),
        error: error?.message || 'Erro desconhecido',
      }
      await this.webhookEventRepo.log(
        new WebhookEvent(null, errorPayload, new Date(), logEventType),
      )
      if (
        error instanceof BadRequestError ||
        error instanceof NotFoundError ||
        error instanceof ConflictError
      ) {
        throw error
      }
      throw new InternalServerError('Erro ao processar o webhook')
    }
  }

  private validateTransactionAmount(transaction: Transaction, amount: number) {
    if (transaction.amount !== amount) {
      throw new BadRequestError(
        'Valor da transação divergente do valor original',
      )
    }
  }

  private async handleFailedTransaction(
    transaction: Transaction,
  ): Promise<void> {
    const payerBalance = await this.userRepo.getBalance(transaction.payer_id)
    const newPayerBalance = BalanceService.credit(
      payerBalance,
      transaction.amount,
    )
    await this.userRepo.updateBalance(transaction.payer_id, newPayerBalance)
    transaction.markAsAmountNotDeducted()
  }

  private async handleApprovedTransaction(
    transaction: Transaction,
  ): Promise<void> {
    const receiverBalance = await this.userRepo.getBalance(
      transaction.receiver_id,
    )
    const newReceiverBalance = BalanceService.credit(
      receiverBalance,
      transaction.amount,
    )
    await this.userRepo.updateBalance(
      transaction.receiver_id,
      newReceiverBalance,
    )
  }
}
