import { TransactionStatusType } from '../../../../shared/constants/transaction-status'
import { Transaction } from '../entities/transaction.entity'

export interface ITransactionRepository {
  create(transaction: Transaction): Promise<void>
  findById(id: string): Promise<Transaction | null>
  findByUserId(userId: string): Promise<Transaction[]>
  updateStatus(id: string, status: TransactionStatusType): Promise<void>
  update(transaction: Transaction): Promise<void>
  existsByIdempotencyKey(key: string): Promise<boolean>
}
