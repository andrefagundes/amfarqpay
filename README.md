# API

API REST para simulação de transações financeiras entre usuários, com suporte a idempotência, webhooks, rate limit, autenticação e documentação Swagger.

## Como rodar o projeto localmente

### Pré-requisitos
- Node.js 21+
- Firebase CLI (`npm install -g firebase-tools`)
- Docker (opcional, para rodar o Firestore emulado)

### Passos
1. Instale as dependências do projeto:
   ```bash
   cd functions
   npm install
   ```
2. Inicie os emuladores do Firebase (Firestore e Functions):
   ```bash
   npm run serve
   ```
   Assim, faz com que:
   - O projeto TypeScript seja compilado
   - O emulador do Firestore suba na porta 8080
   - A API fique disponível na porta 5001
   - O painel do Firebase Emulator fique acessível em: [http://127.0.0.1:4000](http://127.0.0.1:4000)

3. Para acompanhar e interagir com o ambiente, abra o painel do Firebase Emulator:
   - Acesse [http://127.0.0.1:4000](http://127.0.0.1:4000) no navegador.
   - Por lá, poderá:
     - Visualizar e manipular dados do Firestore emulado
     - Acessar a documentação Swagger da API pelo menu "Hosting Emulator" ou [http://127.0.0.1:5000](http://127.0.0.1:5000)
     - Monitorar logs e status dos emuladores

## Como testar os endpoints

- Utilizei o Swagger UI (conforme acima) para testar todos os endpoints disponíveis.
- Ou uso ferramentas como [Insomnia](https://insomnia.rest/) ou [Postman](https://www.postman.com/).

### Autenticação
- Todos os endpoints (exceto `/health`) exigem autenticação via header:
  ```
  Authorization: Bearer <user_id> , como é mock, pode usar uma string qualquer
  ```

### Endpoints principais
- `POST /users` — Crio usuário
- `GET /users/{id}` — Busco usuário
- `PUT /users/{id}` — Atualizo usuário
- `GET /users/{user_id}/transactions` — Listo transações do usuário
- `POST /transactions` — Crio transação (requer header `Idempotency-Key`)
- `POST /transactions/webhook` — Recebo eventos de webhook
- `GET /health` — Health check

Consulte exemplos e schemas completos no Swagger.

## Decisões técnicas

### Idempotência
- Todas as criações de transações exigem o header `Idempotency-Key`.
- Garanto que requisições repetidas com a mesma chave não criam transações duplicadas.
- Se a chave já foi usada, retorno erro 409 (Conflict).
- **Por que uso idempotência?**
  - Em sistemas financeiros, é comum que clientes ou gateways reenviem requisições por falhas de rede ou timeouts. Com a idempotência, asseguro que múltiplas tentativas não resultem em múltiplas transações, evitando inconsistências e prejuízos.
- **Como implemento?**
  - A lógica de idempotência está no próprio use case de criação de transação. Assim que recebo a requisição, extraio a chave do header e, antes de criar qualquer transação, verifico no repositório se aquela chave já foi utilizada. Se sim, lanço um erro de conflito e interrompo o fluxo. Se não, prossigo normalmente e registro a chave junto com a transação. Dessa forma, garanto a proteção sem depender de middleware Express para essa regra de negócio.

### Rate Limit
- Limito a 5 transações por minuto por pagador (`POST /transactions`).
- Limito a 30 webhooks por minuto por IP (`POST /transactions/webhook`).
- Retorno erro 429 (Too Many Requests) ao exceder o limite.
- **Por que uso rate limit?**
  - O rate limit protege minha API contra abusos, ataques de força bruta e uso indevido, além de evitar sobrecarga dos recursos do sistema.
- **Como implemento?**
  - Aqui utilizo middlewares Express dedicados, aplicados diretamente nas rotas. Eles monitoram a frequência das requisições por usuário (ou IP, no caso de webhooks) e bloqueiam automaticamente o excesso, retornando erro 429. Isso desacopla a lógica de limitação do restante do código e facilita manutenção.

### Middlewares
- **Por que uso middlewares?**
  - Os middlewares me permitem aplicar funcionalidades transversais (como autenticação, validação, rate limit, idempotência, logging, etc.) de forma centralizada e reutilizável, sem poluir a lógica principal dos endpoints. Isso resulta em código mais limpo, modular e fácil de testar.

### Validação e Erros
- Valido todas as entradas com [Zod](https://zod.dev/).
- As respostas de erro e sucesso seguem um padrão consistente:
  - Sucesso:
    ```json
    {
      "success": true,
      "data": { ... },
      "timestamp": "2024-01-01T00:00:00.000Z",
      "path": "/api/rota"
    }
    ```
  - Erro:
    ```json
    {
      "success": false,
      "error": {
        "message": "Mensagem de erro",
        "code": "CODIGO_DO_ERRO",
        "statusCode": 400,
        "details": [ ... ]
      },
      "timestamp": "2024-01-01T00:00:00.000Z",
      "path": "/api/rota"
    }
    ```

### Segurança
- Uso do [Helmet](https://helmetjs.github.io/) para headers de segurança.
- Uso de CORS restrito a origens locais por padrão.

### Documentação
- Arquivo Swagger disponível em `functions/docs/index.html`.
- O arquivo `functions/docs/swagger.json` contém a especificação OpenAPI.

## Sugestões de Melhorias

### 1. Imports com Paths Absolutos

Configure paths no `functions/tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@shared/*": ["shared/*"],
      "@modules/*": ["modules/*"]
    }
  }
}
```

Depois, ajuste seus imports:

```ts
// Antes
import { algo } from '../../../../shared/utils';
// Depois
import { algo } from '@shared/utils';
```

No Node.js, para funcionar em tempo de execução, use [tsconfig-paths](https://www.npmjs.com/package/tsconfig-paths):

```bash
npm install tsconfig-paths --save-dev
```

E altere seu script de start no `package.json`:

```json
"start": "ts-node -r tsconfig-paths/register src/main.ts"
```

---

### 2. Observabilidade

#### a) Logs Estruturados com Pino

Instale:

```bash
npm install pino pino-pretty
```

Crie um logger em `src/shared/utils/logger.ts`:

```ts
import pino from 'pino';
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});
export default logger;
```

Use nos controllers ou middlewares:

```ts
import logger from '@shared/utils/logger';
logger.info({ userId }, 'Usuário criado com sucesso');
logger.error({ err }, 'Erro ao criar transação');
```

#### b) Traceamento com OpenTelemetry

Instale:

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node
```

Crie um arquivo `src/shared/config/otel.ts` (exemplo básico):

```ts
import { NodeSDK } from '@opentelemetry/sdk-node';
const sdk = new NodeSDK();
sdk.start();
```

E importe no início do seu `main.ts`:

```ts
import '@shared/config/otel';
```

#### c) Métricas com express-prom-bundle

Instale:

```bash
npm install express-prom-bundle
```

No seu `main.ts`:

```ts
import promBundle from 'express-prom-bundle';
const metricsMiddleware = promBundle({ includeMethod: true });
app.use(metricsMiddleware);
```

Acesse as métricas em `/metrics`.

---

### 3. Testes Automatizados com Jest

Instale:

```bash
npm install --save-dev jest ts-jest @types/jest supertest
```

Crie um teste em `src/modules/user/application/use-cases/__tests__/create-user.usecase.test.ts`:

```ts
import { CreateUserUseCase } from '../create-user.usecase';
describe('CreateUserUseCase', () => {
  it('deve criar um usuário com dados válidos', async () => {
    const useCase = new CreateUserUseCase(/* mocks */);
    const result = await useCase.execute({ nome: 'João', email: 'joao@exemplo.com' });
    expect(result).toHaveProperty('id');
  });
});
```

Adicione no `package.json`:

```json
"scripts": {
  "test": "jest"
}
```

---

### 4. Versionamento de API

No seu arquivo de rotas, por exemplo `src/modules/user/presentation/http/routes/user.routes.ts`:

```ts
app.use('/v1/users', userRoutes);
```

No Swagger, ajuste o `basePath` ou `servers`:

```json
"servers": [
  { "url": "/v1" }
]
```
