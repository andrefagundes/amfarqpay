# Sistema de Eventos Simples

Sistema de eventos direto e prático para disparar e escutar eventos na aplicação.

## Como Funciona

### 1. **EventDispatcher Singleton**
```typescript
type EventHandler = (data: unknown) => Promise<void> | void

export class EventDispatcher {
  private static instance: EventDispatcher
  private handlers: Map<string, EventHandler[]> = new Map()

  static getInstance(): EventDispatcher {
    if (!EventDispatcher.instance) {
      EventDispatcher.instance = new EventDispatcher()
    }
    return EventDispatcher.instance
  }

  on(eventName: string, handler: EventHandler): void
  async emit(eventName: string, data: unknown): Promise<void>
}
```

### 2. **Registro de Listeners com Tipos Específicos**
```typescript
// Em event-listeners.ts
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

export function registerEventListeners(webhookEventRepo: IWebhookEventRepository): void {
  const dispatcher = EventDispatcher.getInstance()

  // Listener para webhook recebido
  dispatcher.on('webhook.received', async (data: unknown) => {
    const eventData = data as WebhookReceivedEventData
    // Salva no banco
    const webhookEvent = new WebhookEvent(null, eventData.payload, new Date(), 'received')
    await webhookEventRepo.log(webhookEvent)

    // Log no console
    console.log(`📝 Webhook logado: ${eventData.transactionId} - ${eventData.status}`)
  })

  // Listener para erro no webhook
  dispatcher.on('webhook.error', async (data: unknown) => {
    const eventData = data as WebhookErrorEventData
    // Salva erro no banco
    const webhookEvent = new WebhookEvent(null, eventData.payload, new Date(), 'error', eventData.error)
    await webhookEventRepo.log(webhookEvent)

    // Log de erro
    console.error(`🚨 Erro no webhook: ${eventData.transactionId} - ${eventData.error}`)
  })
}
```

### 3. **Inicialização na Aplicação**
```typescript
// Em main.ts
import { initializeEvents } from './shared/events/init-events'

// Inicializa o sistema de eventos
initializeEvents()
```

### 4. **Disparando Eventos com Tipos Seguros**
```typescript
// No use case
interface WebhookInputData {
  transaction_id: string
  status: TransactionStatusType
  amount: number
  rawPayload?: WebhookInput
}

export class WebhookPaymentGatewayUseCase {
  private eventDispatcher: EventDispatcher

  constructor() {
    this.eventDispatcher = EventDispatcher.getInstance()
  }

  async execute(input: WebhookInputData) {
    try {
      await this.processWebhook(input)

      // Dispara evento de sucesso
      await this.eventDispatcher.emit('webhook.received', {
        transactionId: input.transaction_id,
        status: input.status,
        amount: input.amount,
        payload: input.rawPayload || input
      })
    } catch (error: unknown) {
      // Dispara evento de erro
      await this.eventDispatcher.emit('webhook.error', {
        transactionId: input.transaction_id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        payload: input.rawPayload || input
      })
      throw error
    }
  }
}
```

## Estrutura

```
shared/events/
├── event-dispatcher.ts     # Dispatcher singleton com tipos seguros
├── event-listeners.ts      # Registro de listeners com interfaces tipadas
├── init-events.ts          # Inicialização
├── index.ts               # Exports
└── README.md              # Esta documentação
```

## Vantagens

### ✅ **Simples**
- Apenas o necessário: dispatcher + listeners
- Sem complexidade desnecessária
- Fácil de entender e usar

### ✅ **Prático**
- Singleton para acesso global
- Registro automático na inicialização
- Múltiplos listeners por evento

### ✅ **Extensível**
- Fácil adicionar novos eventos
- Fácil adicionar novos listeners
- Sem acoplamento forte

### ✅ **Funcional**
- Mantém a funcionalidade original
- Logs salvos no banco
- Notificações no console

### ✅ **Type Safe**
- Tipos específicos para cada evento
- Uso de `unknown` para máxima segurança
- Interfaces bem definidas para os dados

## Como Adicionar Novos Eventos

1. **Defina a interface do evento**:
```typescript
interface NovoEventoData {
  userId: string
  action: string
  timestamp: Date
}
```

2. **Registre o listener**:
```typescript
dispatcher.on('novo.evento', async (data: unknown) => {
  const eventData = data as NovoEventoData
  // Sua lógica aqui
  console.log('Novo evento:', eventData.userId)
})
```

3. **Dispare o evento**:
```typescript
await this.eventDispatcher.emit('novo.evento', {
  userId: 'user_123',
  action: 'login',
  timestamp: new Date()
})
```

4. **Pronto!** O listener será executado automaticamente.

## Exemplo de Uso

```typescript
// Disparando evento
await eventDispatcher.emit('user.created', {
  userId: 'user_123',
  email: 'user@example.com'
})

// Escutando evento
eventDispatcher.on('user.created', async (data: unknown) => {
  const eventData = data as { userId: string; email: string }
  console.log('Usuário criado:', eventData.userId)
  // Enviar email de boas-vindas, etc.
})
```

## Fluxo de Execução

1. **Inicialização**: `initializeEvents()` registra todos os listeners
2. **Uso**: Use cases disparam eventos com `emit()`
3. **Processamento**: Todos os listeners registrados são executados
4. **Resultado**: Logs salvos, notificações enviadas, etc.

## Tipos e Segurança

- **EventDispatcher**: Usa `unknown` para máxima segurança de tipos
- **Listeners**: Usam type assertion (`as`) para converter `unknown` para tipos específicos
- **Payloads**: Usam tipos específicos como `WebhookInput` em vez de `any`
- **Interfaces**: Cada evento tem sua própria interface tipada