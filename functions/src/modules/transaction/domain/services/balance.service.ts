import { BadRequestError } from '../../../../shared/errors/bad-request.error'

export class BalanceService {
  static hasEnoughFunds(balance: number, amount: number): boolean {
    if (amount <= 0)
      throw new BadRequestError('Valor da transação deve ser positivo')
    return balance >= amount
  }

  static deduct(balance: number, amount: number): number {
    if (amount <= 0)
      throw new BadRequestError('Valor da transação deve ser positivo')
    if (balance < amount) throw new BadRequestError('Saldo insuficiente')
    return balance - amount
  }

  static credit(balance: number, amount: number): number {
    if (amount <= 0)
      throw new BadRequestError('Valor da transação deve ser positivo')
    return balance + amount
  }
}
