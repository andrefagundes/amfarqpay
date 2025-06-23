import { WebhookEvent } from '../entities/webhook-event.entity'

export interface IWebhookEventRepository {
  log(event: WebhookEvent): Promise<void>
}
