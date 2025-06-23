import { getFirestore } from 'firebase-admin/firestore'
import { NotFoundError } from '../../../../../shared/errors/not-found.error'
import { User } from '../../../domain/entities/user.entity'
import { IUserRepository } from '../../../domain/repositories/user.repository.interface'

export class FirestoreUserRepository implements IUserRepository {
  private collection = getFirestore().collection('users')
  private db = getFirestore()

  async create(user: User): Promise<void> {
    await this.collection.doc(user.id).set({
      name: user.name,
      email: user.email,
      balance: user.balance,
    })
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()
    if (!data) return null

    return new User({
      id: doc.id,
      name: data.name,
      email: data.email,
      balance: data.balance,
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection
      .where('email', '==', email)
      .limit(1)
      .get()
    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    const data = doc.data()
    return new User({
      id: doc.id,
      name: data.name,
      email: data.email,
      balance: data.balance,
    })
  }

  async update(user: User): Promise<void> {
    await this.collection.doc(user.id).update({
      name: user.name,
      email: user.email,
    })
  }

  async updateBalance(userId: string, newBalance: number): Promise<void> {
    const userRef = this.collection.doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      throw new NotFoundError('Usuário não encontrado')
    }

    await userRef.update({ balance: newBalance })
  }

  async getBalance(userId: string): Promise<number> {
    const userRef = this.collection.doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      throw new NotFoundError('Usuário não encontrado')
    }

    const userData = userDoc.data()
    if (!userData) {
      throw new NotFoundError('Dados do usuário não encontrados')
    }

    return userData.balance
  }
}
