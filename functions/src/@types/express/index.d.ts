import 'express'

declare module 'express' {
  interface Request {
    user?: {
      id: string
    }
  }
}

declare global {
  namespace Express {
    interface Response {
      success: <T>(data: T, statusCode?: number) => Response
    }
  }
}

export {}
