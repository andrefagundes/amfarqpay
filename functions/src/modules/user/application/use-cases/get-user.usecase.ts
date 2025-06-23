import { NotFoundError } from '../../../../shared/errors/not-found.error'
import { User } from '../../domain/entities/user.entity'
import { IUserRepository } from '../../domain/repositories/user.repository.interface'

export class GetUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id)
    if (!user) throw new NotFoundError('User not found')
    return user
  }
}
