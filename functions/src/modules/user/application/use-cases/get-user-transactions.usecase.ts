import { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface'
import { UserTransactionSummaryDTO } from '../dtos/get-user-transactions.dto'

export class GetUserTransactionsUseCase {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(userId: string): Promise<UserTransactionSummaryDTO[]> {
    const transactions = await this.transactionRepository.findByUserId(userId)

    return transactions.map((txn) => ({
      transaction_id: txn.id,
      direction: txn.payer_id === userId ? 'sent' : 'received',
      amount: txn.amount,
      status: txn.status,
    }))
  }
}
