export class TransactionStatusError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TransactionStatusError'
  }
}
