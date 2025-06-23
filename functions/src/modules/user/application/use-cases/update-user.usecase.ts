import { NotFoundError } from '../../../../shared/errors/not-found.error'
import { User } from '../../domain/entities/user.entity'
import { IUserRepository } from '../../domain/repositories/user.repository.interface'
import { UpdateUserDTO } from '../dtos/update-user.dto'

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, input: UpdateUserDTO): Promise<User> {
    const user = await this.userRepository.findById(id)
    if (!user) throw new NotFoundError('User not found')

    if (input.name !== undefined) {
      user.name = input.name
    }
    if (input.email !== undefined) {
      user.email = input.email
    }

    await this.userRepository.update(user)
    return user
  }
}
