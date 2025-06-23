export class WebhookEvent {
  constructor(
    public readonly id: string | null,
    public readonly payload: any,
    public readonly receivedAt: Date = new Date(),
    public readonly eventType?: string,
  ) {}
}
