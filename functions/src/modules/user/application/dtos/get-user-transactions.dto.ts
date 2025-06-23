import { TransactionStatusType } from '../../../../shared/constants/transaction-status'

export interface UserTransactionSummaryDTO {
  transaction_id: string
  direction: 'sent' | 'received'
  amount: number
  status: TransactionStatusType
}
