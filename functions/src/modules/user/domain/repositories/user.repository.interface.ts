import { User } from '../entities/user.entity'

export interface IUserRepository {
  create(user: User): Promise<void>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  update(user: User): Promise<void>
  updateBalance(userId: string, newBalance: number): Promise<void>
  getBalance(userId: string): Promise<number>
}
