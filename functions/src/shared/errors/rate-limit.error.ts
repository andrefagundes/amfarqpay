export class RateLimitError extends Error {
  statusCode: number

  constructor(message = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
    this.statusCode = 429
  }
}
