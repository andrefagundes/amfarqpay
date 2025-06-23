export class ConflictError extends Error {
  statusCode: number

  constructor(message = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
    this.statusCode = 409
  }
}
