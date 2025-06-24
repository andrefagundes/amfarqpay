import { WebhookInput } from '../../../../shared/schemas/transaction.schemas'

export class WebhookEvent {
  constructor(
    public readonly id: string | null,
    public readonly payload: WebhookInput,
    public readonly receivedAt: Date = new Date(),
    public readonly eventType?: string,
    public readonly msg?: string,
  ) {}
}
