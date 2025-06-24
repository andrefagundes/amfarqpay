import {
  TransactionStatus,
  TransactionStatusType,
} from '../../../../shared/constants/transaction-status'
import { BadRequestError } from '../../../../shared/errors/bad-request.error'
import { ConflictError } from '../../../../shared/errors/conflit.error'
import { InternalServerError } from '../../../../shared/errors/internal-server.error'
import { NotFoundError } from '../../../../shared/errors/not-found.error'
import { EventDispatcher } from '../../../../shared/events/event-dispatcher'
import { WebhookInput } from '../../../../shared/schemas/transaction.schemas'
import { IUserRepository } from '../../../user/domain/repositories/user.repository.interface'
import { Transaction } from '../../domain/entities/transaction.entity'
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface'
import { BalanceService } from '../../domain/services/balance.service'

interface WebhookInputData {
  transaction_id: string
  status: TransactionStatusType
  amount: number
  rawPayload?: WebhookInput
}

export class WebhookPaymentGatewayUseCase {
  private eventDispatcher: EventDispatcher

  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly userRepo: IUserRepository,
  ) {
    this.eventDispatcher = EventDispatcher.getInstance()
  }

  async execute(input: WebhookInputData) {
    try {
      await this.processWebhook(input)

      await this.eventDispatcher.emit('webhook.received', {
        transactionId: input.transaction_id,
        status: input.status,
        amount: input.amount,
        payload: input.rawPayload || input,
      })
    } catch (error: unknown) {
      await this.eventDispatcher.emit('webhook.error', {
        transactionId: input.transaction_id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        payload: input.rawPayload || input,
      })

      this.rethrowAppropriateError(error)
    }
  }

  private async processWebhook(input: {
    transaction_id: string
    status: TransactionStatusType
    amount: number
  }) {
    const transaction = await this.transactionRepo.findById(
      input.transaction_id,
    )
    if (!transaction) throw new NotFoundError('Transação não encontrada')

    this.validateTransactionAmount(transaction, input.amount)
    transaction.updateStatus(input.status)

    await this.handleTransactionStatusChange(transaction)
    await this.transactionRepo.update(transaction)
  }

  private validateTransactionAmount(transaction: Transaction, amount: number) {
    if (transaction.amount !== amount) {
      throw new BadRequestError(
        'Valor da transação divergente do valor original',
      )
    }
  }

  private async handleTransactionStatusChange(transaction: Transaction) {
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
  }

  private rethrowAppropriateError(error: unknown) {
    if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError
    ) {
      throw error
    }
    throw new InternalServerError('Erro ao processar o webhook')
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
}
