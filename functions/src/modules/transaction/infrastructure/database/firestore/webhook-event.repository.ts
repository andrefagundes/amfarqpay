import { getFirestore } from 'firebase-admin/firestore'
import { WebhookEvent } from '../../../domain/entities/webhook-event.entity'
import { IWebhookEventRepository } from '../../../domain/repositories/webhook-event.repository.interface'

export class FirestoreWebhookEventRepository
  implements IWebhookEventRepository
{
  private collection = getFirestore().collection('webhook_events')

  async log(event: WebhookEvent): Promise<void> {
    await this.collection.add({
      payload: event.payload,
      receivedAt: event.receivedAt.toISOString(),
      eventType: event.eventType || null,
    })
  }
}
