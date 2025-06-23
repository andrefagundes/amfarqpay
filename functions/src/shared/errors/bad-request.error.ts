export class BadRequestError extends Error {
  statusCode: number

  constructor(message = 'Bad request') {
    super(message)
    this.name = 'BadRequestError'
    this.statusCode = 400
  }
}
