import { getFirestore } from 'firebase-admin/firestore'
import { TransactionStatus } from '../../../../../shared/constants/transaction-status'
import { Transaction } from '../../../domain/entities/transaction.entity'
import { ITransactionRepository } from '../../../domain/repositories/transaction.repository.interface'

export class FirestoreTransactionRepository implements ITransactionRepository {
  private collection = getFirestore().collection('transactions')
  private idempotencyCollection = getFirestore().collection('idempotency_keys')

  async create(transaction: Transaction): Promise<void> {
    await this.collection.doc(transaction.id).set({
      payer_id: transaction.payer_id,
      receiver_id: transaction.receiver_id,
      amount: transaction.amount,
      status: transaction.status,
      created_at: transaction.created_at.toISOString(),
      isAmountDeducted: transaction.isAmountDeducted,
    })

    await this.idempotencyCollection.doc(transaction.idempotencyKey).set({
      created_at: new Date().toISOString(),
    })
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) return null

    const data = doc.data()
    if (!data) return null

    return new Transaction({
      id: doc.id,
      payer_id: data.payer_id,
      receiver_id: data.receiver_id,
      amount: data.amount,
      status: data.status,
      created_at: new Date(data.created_at),
      idempotencyKey: data.idempotencyKey,
      isAmountDeducted: data.isAmountDeducted,
    })
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const sentQuery = this.collection.where('payer_id', '==', userId).get()
    const receivedQuery = this.collection
      .where('receiver_id', '==', userId)
      .get()
    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      sentQuery,
      receivedQuery,
    ])

    const parseDoc = (
      doc: FirebaseFirestore.QueryDocumentSnapshot,
    ): Transaction => {
      const data = doc.data()
      return new Transaction({
        id: doc.id,
        payer_id: data.payer_id,
        receiver_id: data.receiver_id,
        amount: data.amount,
        status: data.status,
        created_at: new Date(data.created_at),
        idempotencyKey: data.idempotencyKey,
        isAmountDeducted: data.isAmountDeducted,
      })
    }

    return [...sentSnapshot.docs, ...receivedSnapshot.docs].map(parseDoc)
  }

  async updateStatus(
    id: string,
    status: TransactionStatus.APPROVED | TransactionStatus.FAILED,
  ): Promise<void> {
    await this.collection.doc(id).update({ status })
  }

  async update(transaction: Transaction): Promise<void> {
    await this.collection.doc(transaction.id).update({
      status: transaction.status,
      isAmountDeducted: transaction.isAmountDeducted,
    })
  }

  async existsByIdempotencyKey(key: string): Promise<boolean> {
    const doc = await this.idempotencyCollection.doc(key).get()
    return doc.exists
  }
}
