import { Request, Response } from 'express'
import { ITransactionRepository } from '../../../../transaction/domain/repositories/transaction.repository.interface'
import { CreateUserUseCase } from '../../../application/use-cases/create-user.usecase'
import { GetUserTransactionsUseCase } from '../../../application/use-cases/get-user-transactions.usecase'
import { GetUserUseCase } from '../../../application/use-cases/get-user.usecase'
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.usecase'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'

export class UserController {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async create(req: Request, res: Response) {
    const useCase = new CreateUserUseCase(this.userRepository)
    const result = await useCase.execute(req.body)
    res.success(result, 201)
  }

  async findById(req: Request, res: Response) {
    const useCase = new GetUserUseCase(this.userRepository)
    const result = await useCase.execute(req.params.id)
    res.success(result)
  }

  async update(req: Request, res: Response) {
    const useCase = new UpdateUserUseCase(this.userRepository)
    const result = await useCase.execute(req.params.id, req.body)
    res.success(result)
  }

  async getTransactions(req: Request, res: Response) {
    const useCase = new GetUserTransactionsUseCase(this.transactionRepository)
    const result = await useCase.execute(req.params.user_id)
    res.success(result)
  }
}
