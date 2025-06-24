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

  on(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, [])
    }
    this.handlers.get(eventName)!.push(handler)
  }

  async emit(eventName: string, data: unknown): Promise<void> {
    const handlers = this.handlers.get(eventName) || []

    const promises = handlers.map((handler) =>
      Promise.resolve(handler(data)).catch((error) => {
        console.error(`Erro no handler do evento ${eventName}:`, error)
      }),
    )

    await Promise.all(promises)
  }

  clear(): void {
    this.handlers.clear()
  }
}
