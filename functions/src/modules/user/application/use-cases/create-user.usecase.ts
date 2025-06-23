import { ConflictError } from '../../../../shared/errors/conflit.error'
import { User } from '../../domain/entities/user.entity'
import { IUserRepository } from '../../domain/repositories/user.repository.interface'
import { CreateUserDTO } from '../dtos/create-user.dto'

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserDTO): Promise<User> {
    const existing = await this.userRepository.findByEmail(input.email)
    if (existing) throw new ConflictError('Email already in use')

    const user = new User({
      name: input.name,
      email: input.email,
      balance: input.balance,
    })

    await this.userRepository.create(user)
    return user
  }
}
