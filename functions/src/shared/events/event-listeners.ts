import { WebhookEvent } from '../../modules/transaction/domain/entities/webhook-event.entity'
import { IWebhookEventRepository } from '../../modules/transaction/domain/repositories/webhook-event.repository.interface'
import { WebhookInput } from '../schemas/transaction.schemas'
import { EventDispatcher } from './event-dispatcher'

interface WebhookReceivedEventData {
  transactionId: string
  status: string
  amount: number
  payload: WebhookInput
}

interface WebhookErrorEventData {
  transactionId: string
  error: string
  payload: WebhookInput
}

export function registerEventListeners(
  webhookEventRepo: IWebhookEventRepository,
): void {
  const dispatcher = EventDispatcher.getInstance()

  dispatcher.on('webhook.received', async (data: unknown) => {
    const eventData = data as WebhookReceivedEventData
    const webhookEvent = new WebhookEvent(
      null,
      eventData.payload,
      new Date(),
      'received',
    )
    await webhookEventRepo.log(webhookEvent)
    console.log(
      `📝 Webhook logado: ${eventData.transactionId} - ${eventData.status}`,
    )
    console.log(
      `📢 Notificação: Webhook recebido para transação ${eventData.transactionId} com status ${eventData.status}`,
    )
    // Aqui você pode enviar uma msg ao Slack, email, etc, deixei só pra ideia.
  })

  dispatcher.on('webhook.error', async (data: unknown) => {
    const eventData = data as WebhookErrorEventData
    const webhookEvent = new WebhookEvent(
      null,
      eventData.payload,
      new Date(),
      'error',
      eventData.error,
    )
    await webhookEventRepo.log(webhookEvent)
    console.error(
      `🚨 Erro no webhook logado: ${eventData.transactionId} - ${eventData.error}`,
    )
  })

  console.log('✅ Event listeners registrados com sucesso!')
}
