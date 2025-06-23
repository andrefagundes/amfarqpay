# Sistema de Tratamento de Erros e Validação

Este sistema fornece um tratamento padronizado de erros e validação robusta usando Zod para a API, garantindo respostas consistentes e amigáveis.

## Validação com Zod

O sistema utiliza Zod para validação de dados de entrada, fornecendo:

- **Type Safety**: Validação em tempo de execução com inferência de tipos TypeScript
- **Mensagens de erro detalhadas**: Erros específicos por campo
- **Transformação automática**: Limpeza e formatação de dados
- **Validação customizada**: Regras de negócio específicas

### Schemas Disponíveis

#### Usuários
```typescript
import { createUserSchema, updateUserSchema, userIdSchema } from '../shared/schemas'

// Validação de criação de usuário
router.post('/', validateBody(createUserSchema), controller.create)

// Validação de atualização de usuário
router.put('/:id', validateParams(userIdSchema), validateBody(updateUserSchema), controller.update)
```

#### Transações
```typescript
import { createTransactionSchema, transactionIdSchema, webhookSchema } from '../shared/schemas'

// Validação de criação de transação com headers
router.post('/', validateRequest({
  body: createTransactionSchema,
  headers: idempotencyHeaderSchema,
}), controller.create)

// Validação de webhook
router.post('/webhook', validateBody(webhookSchema), controller.handleWebhook)
```

## Classes de Erro Disponíveis

### 1. BadRequestError (400)
Para requisições com dados inválidos ou malformados.

```typescript
import { BadRequestError } from '../shared/errors'

throw new BadRequestError('Dados de entrada inválidos')
```

### 2. UnauthorizedError (401)
Para requisições sem autenticação adequada.

```typescript
import { UnauthorizedError } from '../shared/errors'

throw new UnauthorizedError('Token de autorização é obrigatório')
```

### 3. ForbiddenError (403)
Para requisições autenticadas mas sem permissão.

```typescript
import { ForbiddenError } from '../shared/errors'

throw new ForbiddenError('Acesso negado')
```

### 4. NotFoundError (404)
Para recursos não encontrados.

```typescript
import { NotFoundError } from '../shared/errors'

throw new NotFoundError('Usuário não encontrado')
```

### 5. ConflictError (409)
Para conflitos de dados (ex: email já existe).

```typescript
import { ConflictError } from '../shared/errors'

throw new ConflictError('Email já está em uso')
```

### 6. InternalServerError (500)
Para erros internos do servidor.

```typescript
import { InternalServerError } from '../shared/errors'

throw new InternalServerError('Erro interno do servidor')
```

### 7. RateLimitError (429)
Para quando o limite de requisições é excedido.

```typescript
import { RateLimitError } from '../shared/errors'

throw new RateLimitError('Limite de requisições excedido')
```

### 8. TransactionStatusError
Para erros relacionados ao status de transações.

```typescript
import { TransactionStatusError } from '../shared/errors'

throw new TransactionStatusError('Status da transação inválido')
```

## Formato de Resposta de Erro

Todas as respostas de erro seguem o formato:

```json
{
  "success": false,
  "error": {
    "message": "Mensagem de erro em português",
    "code": "CODIGO_DO_ERRO",
    "statusCode": 400,
    "details": [
      "name: Nome deve ter pelo menos 2 caracteres",
      "email: Email deve ser válido"
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users/123"
}
```

## Formato de Resposta de Sucesso

Todas as respostas de sucesso seguem o formato:

```json
{
  "success": true,
  "data": {
    // dados da resposta
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users/123"
}
```

## Como Usar

### 1. Em Use Cases
```typescript
import { NotFoundError } from '../shared/errors'

export class GetUserUseCase {
  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundError('Usuário não encontrado')
    }
    return user
  }
}
```

### 2. Em Controllers
```typescript
export class UserController {
  async findById(req: Request, res: Response) {
    const useCase = new GetUserUseCase(this.userRepository)
    const result = await useCase.execute(req.params.id)
    res.success(result) // Resposta padronizada
  }
}
```

### 3. Em Middlewares
```typescript
import { UnauthorizedError } from '../shared/errors'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    throw new UnauthorizedError('Token de autorização é obrigatório')
  }
  next()
}
```

## Middlewares de Validação

### validateBody
Valida o corpo da requisição:
```typescript
router.post('/', validateBody(createUserSchema), controller.create)
```

### validateParams
Valida parâmetros da URL:
```typescript
router.get('/:id', validateParams(userIdSchema), controller.findById)
```

### validateQuery
Valida query parameters:
```typescript
router.get('/', validateQuery(searchSchema), controller.search)
```

### validateHeaders
Valida headers da requisição:
```typescript
router.post('/', validateHeaders(authHeaderSchema), controller.create)
```

### validateRequest
Valida múltiplos campos de uma vez:
```typescript
router.post('/', validateRequest({
  body: createSchema,
  params: idSchema,
  headers: authSchema,
}), controller.create)
```

## Middlewares Disponíveis

### asyncHandler
Wrapper para funções assíncronas que captura erros automaticamente:

```typescript
router.get('/:id', asyncHandler(controller.findById.bind(controller)))
```

## Códigos de Erro Padrão

- `BAD_REQUEST`: Dados de entrada inválidos
- `UNAUTHORIZED`: Não autenticado
- `FORBIDDEN`: Sem permissão
- `NOT_FOUND`: Recurso não encontrado
- `CONFLICT`: Conflito de dados
- `INTERNAL_SERVER_ERROR`: Erro interno
- `VALIDATION_ERROR`: Erro de validação (Zod)
- `INVALID_ID`: ID inválido
- `DUPLICATE_KEY`: Chave duplicada
- `DATABASE_ERROR`: Erro no banco de dados

## Exemplos de Validação

### Schema de Usuário
```typescript
export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z
    .string()
    .email('Email deve ser válido')
    .toLowerCase()
    .trim(),
  balance: z
    .number()
    .min(0, 'Saldo deve ser um número positivo')
    .optional()
    .default(0),
})
```

### Schema de Transação com Validação Customizada
```typescript
export const createTransactionSchema = z.object({
  payer_id: z.string().min(1, 'ID do pagador é obrigatório'),
  receiver_id: z.string().min(1, 'ID do recebedor é obrigatório'),
  amount: z.number().positive('Valor deve ser um número positivo'),
})
.refine(
  (data) => data.payer_id !== data.receiver_id,
  {
    message: 'Pagador e recebedor não podem ser o mesmo',
    path: ['receiver_id'],
  }
)
```