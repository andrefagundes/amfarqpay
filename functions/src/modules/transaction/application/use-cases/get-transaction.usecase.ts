import { NotFoundError } from '../../../../shared/errors/not-found.error'
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface'

export class GetTransactionUseCase {
  constructor(private readonly repo: ITransactionRepository) {}

  async execute(id: string) {
    const transaction = await this.repo.findById(id)
    if (!transaction) throw new NotFoundError('Transação não encontrada')
    return transaction
  }
}
