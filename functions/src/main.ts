import { json } from 'body-parser'
import cors from 'cors'
import express from 'express'
import * as functions from 'firebase-functions'
import helmet from 'helmet'
import './config/firebase'
import { transactionRoutes } from './modules/transaction/presentation/http/routes/transaction.routes'
import { userRoutes } from './modules/user/presentation/http/routes/user.routes'
import { initializeEvents } from './shared/events/init-events'
import { errorHandler } from './shared/middlewares/error-handler'
import { responseHandler } from './shared/middlewares/response-handler'
import { sanitizationMiddleware } from './shared/middlewares/sanitization'

initializeEvents()

const app = express()

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000, //1 ano
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" },
  })
)

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'idempotency-key',
  ],
}
app.use(cors(corsOptions))

app.use(json({ limit: '10mb' }))

app.use(sanitizationMiddleware)

app.use(responseHandler)

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  })
})

app.use('/users', userRoutes)
app.use('/transactions', transactionRoutes)

app.use(errorHandler)

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Rota não encontrada',
      code: 'NOT_FOUND',
      statusCode: 404,
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  })
})

export const api = functions.https.onRequest(app)
