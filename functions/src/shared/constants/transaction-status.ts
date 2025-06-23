export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FAILED = 'failed',
}

export type TransactionStatusType =
  | TransactionStatus.PENDING
  | TransactionStatus.APPROVED
  | TransactionStatus.FAILED
