import { FirestoreWebhookEventRepository } from '../../modules/transaction/infrastructure/database/firestore/webhook-event.repository'
import { registerEventListeners } from './event-listeners'

export function initializeEvents(): void {
  console.log('🚀 Inicializando sistema de eventos...')

  const webhookEventRepo = new FirestoreWebhookEventRepository()
  registerEventListeners(webhookEventRepo)

  console.log('✅ Sistema de eventos inicializado com sucesso!')
}
