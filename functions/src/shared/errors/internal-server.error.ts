export class InternalServerError extends Error {
  statusCode: number

  constructor(message = 'Internal server error') {
    super(message)
    this.name = 'InternalServerError'
    this.statusCode = 500
  }
}
