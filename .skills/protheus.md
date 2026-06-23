# Skill: Protheus

## Quando utilizar
Ao criar ou modificar integrações com o ERP TOTVS Protheus — novas chamadas de API, tratamento de resposta, autenticação ou mapeamento de dados.

## Contexto

O backend é o **TOTVS Protheus** hospedado na cloud TOTVS:
- Dev: `http://localhost:8181` (via proxy `proxy.conf.js`)
- Prod: `https://institutoclima128986.protheus.cloudtotvs.com.br:4050`
- Base path: `/rest/`

**Autenticação:** OAuth2 com `grant_type=password`  
**Token:** JWT Bearer enviado via interceptor automático

## Autenticação OAuth2

```typescript
// Fluxo:
// 1. POST /api/oauth2/v1/token → access_token
// 2. POST /rest/login (com Bearer token) → dados do usuário
// 3. Todas as chamadas seguintes: Authorization: Bearer {access_token}
// O auth.interceptor.ts já injeta o header automaticamente
```

## Padrão de Chamadas

```typescript
// SEMPRE usar ConfigService para montar URL
const url = this.config.getRestEndpoint('MEUENDPOINT');

// SEMPRE adicionar timeout e retry
this.http.get<MinhaDto[]>(url).pipe(
  timeout(30_000),           // 30s — Protheus pode ser lento
  retry({ count: 2, delay: 1000 }),  // 2 retries em falha de rede
  map(response => this.mapearResposta(response)),
  catchError(this.tratarErro.bind(this))
)
```

## Paginação

O Protheus usa query params `page` e `pageSize`:
```typescript
const params = new HttpParams()
  .set('page', String(pagina))
  .set('pageSize', '20');

this.http.get<ProtheusListDto<Item>>(url, { params })
```

## Formato de Resposta Comum

```typescript
// Protheus geralmente retorna
interface ProtheusListDto<T> {
  items: T[];
  total: number;
  hasNext: boolean;
  page: number;
  pageSize: number;
}

// Ou resposta direta de array
// Mapear sempre no service — componente não deve conhecer formato da API
```

## Erros do Protheus

```typescript
// Protheus pode retornar erro em múltiplos formatos:
interface ProtheusError {
  code?: string;
  message?: string;
  detailedMessage?: string;
  helpUrl?: string;
}

// Tratamento padronizado
private tratarErro(error: HttpErrorResponse): Observable<never> {
  const msg = error.error?.message
    ?? error.error?.detailedMessage
    ?? 'Erro ao comunicar com o servidor.';
  console.error('[MeuService] Erro Protheus:', error.status, error.url);
  return throwError(() => ({ status: error.status, message: msg }));
}
```

## Endpoints Mapeados

| Domínio | Endpoint | Método | Descrição |
|---|---|---|---|
| Auth | `/api/oauth2/v1/token` | POST | Gera token OAuth2 |
| Auth | `/rest/login` | POST | Valida token e retorna usuário |
| Menus | `/rest/patentes/menus` | GET | Menus do usuário |
| Patentes | `/rest/patentes` | GET | Lista patentes |
| Financeiro | `/rest/PRESTACAOCONTA/codigo` | GET | Gera código prestação |
| Financeiro | `/rest/PARTICIPANTES/{codigo}` | GET | Busca participante |
| Financeiro | `/rest/PRESTACAOCONTA/CENTROSCUSTO` | POST | Lista centros de custo |
| Compras | `/rest/PEDIDOCOMPRAS` | GET/POST/PUT | Solicitações de compras |

## Boas Práticas

- **Mapear sempre no service** — componente não deve conhecer a estrutura raw do Protheus
- **Cache local** para dados estáticos (menus, listas de classificação) com TTL
- **Não expor** campos `Protheus-internos` (como `R_E_C_N_O_`) no modelo da UI
- **Nomenclatura em PT-BR** nos services e modelos — é o domínio do projeto
- **Validar entrada** antes de enviar ao Protheus (evitar erros 400 evitáveis)

## Anti-patterns

- Chamar Protheus diretamente no componente (deve ser via service)
- Passar objetos raw do Protheus para o template (sempre mapear)
- Sem timeout (Protheus pode demorar)
- Sem tratamento de erro específico (402, 403, 500 têm tratamentos diferentes)
- Concatenar params na URL (usar `HttpParams`)
- Fazer retry em POST sem verificar idempotência
