import {
  TransactionStatus,
  TransactionStatusType,
} from '../../../../shared/constants/transaction-status'
import { TransactionStatusError } from '../../../../shared/errors/transaction-status.error'

export class Transaction {
  private _status: TransactionStatusType
  private _isAmountDeducted = false

  get status() {
    return this._status
  }

  get isAmountDeducted() {
    return this._isAmountDeducted
  }

  public updateStatus(newStatus: TransactionStatusType) {
    if (this._status !== TransactionStatus.PENDING) {
      throw new TransactionStatusError(
        `Transação já finalizada como '${this._status}' e não pode ser alterada`,
      )
    }

    if (
      newStatus !== TransactionStatus.APPROVED &&
      newStatus !== TransactionStatus.FAILED
    ) {
      throw new TransactionStatusError(`Status inválido: '${newStatus}'`)
    }

    this._status = newStatus
  }

  public markAsAmountDeducted() {
    this._isAmountDeducted = true
  }

  public markAsAmountNotDeducted() {
    this._isAmountDeducted = false
  }

  constructor(props: {
    id: string
    payer_id: string
    receiver_id: string
    amount: number
    status?: TransactionStatusType
    created_at?: Date
    idempotencyKey: string
    isAmountDeducted?: boolean
  }) {
    this.id = props.id
    this.payer_id = props.payer_id
    this.receiver_id = props.receiver_id
    this.amount = props.amount
    this._status = props.status ?? TransactionStatus.PENDING
    this.created_at = props.created_at ?? new Date()
    this.idempotencyKey = props.idempotencyKey
    this._isAmountDeducted = props.isAmountDeducted ?? false
  }

  public readonly id: string
  public readonly payer_id: string
  public readonly receiver_id: string
  public readonly amount: number
  public readonly created_at: Date
  public readonly idempotencyKey: string
}
