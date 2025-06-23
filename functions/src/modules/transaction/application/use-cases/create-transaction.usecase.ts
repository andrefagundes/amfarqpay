import { randomUUID } from 'crypto'
import { BadRequestError } from '../../../../shared/errors/bad-request.error'
import { ConflictError } from '../../../../shared/errors/conflit.error'
import { NotFoundError } from '../../../../shared/errors/not-found.error'
import { IUserRepository } from '../../../user/domain/repositories/user.repository.interface'
import { Transaction } from '../../domain/entities/transaction.entity'
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface'
import { BalanceService } from '../../domain/services/balance.service'

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(input: {
    payer_id: string
    receiver_id: string
    amount: number
    idempotencyKey: string
  }): Promise<{ transaction_id: string; status: string; created_at: string }> {
    const { payer_id, receiver_id, amount, idempotencyKey } = input

    if (amount <= 0) {
      throw new BadRequestError('Valor da transação deve ser positivo')
    }

    if (payer_id === receiver_id) {
      throw new BadRequestError('Pagador e recebedor não podem ser os mesmos')
    }

    const exists =
      await this.transactionRepo.existsByIdempotencyKey(idempotencyKey)
    if (exists) throw new ConflictError('Idempotency-Key já utilizado')

    const payer = await this.userRepo.findById(payer_id)
    const receiver = await this.userRepo.findById(receiver_id)

    if (!payer || !receiver) throw new NotFoundError('Usuário não encontrado')

    if (!BalanceService.hasEnoughFunds(payer.balance, amount)) {
      throw new ConflictError('Saldo insuficiente')
    }

    const newPayerBalance = BalanceService.deduct(payer.balance, amount)
    await this.userRepo.updateBalance(payer_id, newPayerBalance)

    const transaction = new Transaction({
      id: randomUUID(),
      payer_id,
      receiver_id,
      amount,
      idempotencyKey,
    })
    transaction.markAsAmountDeducted()
    await this.transactionRepo.create(transaction)

    return {
      transaction_id: transaction.id,
      status: transaction.status,
      created_at: transaction.created_at.toISOString(),
    }
  }
}
