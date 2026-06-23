# Skill: API

## Quando utilizar
Ao criar ou modificar qualquer chamada HTTP, service de integração, ou mapeamento de dados da API.

## Padrão de Service HTTP

```typescript
@Injectable({ providedIn: 'root' })
export class MeuService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  // GET com paginação
  listar(pagina = 1, tamanhoPagina = 20): Observable<Item[]> {
    const params = new HttpParams()
      .set('page', String(pagina))
      .set('pageSize', String(tamanhoPagina));

    return this.http
      .get<ProtheusListDto<ItemApiDto>>(
        this.config.getRestEndpoint('MEUENDPOINT'),
        { params }
      )
      .pipe(
        timeout(30_000),
        map(response => response.items.map(this.mapearItem)),
        catchError(tratarErroHttp('MeuService.listar'))
      );
  }

  // POST
  criar(dto: CriarItemDto): Observable<Item> {
    return this.http
      .post<ItemApiDto>(this.config.getRestEndpoint('MEUENDPOINT'), dto)
      .pipe(
        timeout(30_000),
        map(this.mapearItem),
        catchError(tratarErroHttp('MeuService.criar'))
      );
  }

  // Mapeamento: API → domínio (nunca expor estrutura raw da API)
  private mapearItem(dto: ItemApiDto): Item {
    return {
      id: dto.R_E_C_N_O_ ?? dto.codigo,
      nome: dto.NOME?.trim() ?? '',
      ativo: dto.STATUS === 'A',
    };
  }
}
```

## Tipos de DTOs

```typescript
// DTO de resposta (API → frontend)
interface ItemApiDto {
  codigo: string;
  NOME: string;
  STATUS: string;
  R_E_C_N_O_?: number;
}

// DTO de requisição (frontend → API)
interface CriarItemDto {
  nome: string;
  codigo: string;
}

// Modelo de domínio (usado no componente)
interface Item {
  id: string;
  nome: string;
  ativo: boolean;
}
```

## Tratamento de Erros Padronizado

```typescript
// src/app/shared/utils/http-error.utils.ts
export function tratarErroHttp(context: string) {
  return (error: HttpErrorResponse): Observable<never> => {
    const status = error.status;
    // Log sem dados sensíveis
    console.error(`[${context}] Erro ${status}:`, error.url);

    const mensagem = error.error?.message
      ?? error.error?.detailedMessage
      ?? mensagemPadraoPorStatus(status);

    return throwError(() => ({ status, mensagem }));
  };
}

function mensagemPadraoPorStatus(status: number): string {
  const msgs: Record<number, string> = {
    400: 'Dados inválidos. Verifique os campos e tente novamente.',
    401: 'Sessão expirada. Faça login novamente.',
    403: 'Sem permissão para esta ação.',
    404: 'Recurso não encontrado.',
    500: 'Erro interno do servidor. Tente novamente em alguns instantes.',
  };
  return msgs[status] ?? 'Erro ao comunicar com o servidor.';
}
```

## Configuração de URLs (ConfigService)

```typescript
// Sempre usar ConfigService — nunca URL hardcoded no service
this.config.getRestEndpoint('MEUENDPOINT')
// Dev: http://localhost:8181/rest/MEUENDPOINT (via proxy)
// Prod: https://...protheus.cloudtotvs.com.br:4050/rest/MEUENDPOINT
```

## Interceptors Ativos

| Interceptor | Função |
|---|---|
| `auth.interceptor.ts` | Injeta `Authorization: Bearer {token}` |
| — | 401 → logout + redirect para /login |

## Anti-patterns de API

- URL hardcoded no service (usar `ConfigService`)
- `http.get<any>()` sem tipagem
- Sem `timeout()` (Protheus pode ficar lento)
- Estrutura raw da API exposta no componente (sempre mapear)
- Parâmetros na URL por concatenação (usar `HttpParams`)
- Retry em POST sem verificar idempotência
- Tratar erro no componente (deve ser no service)
- `subscribe()` dentro de `subscribe()` (usar operadores RxJS)

## Checklist de API (por service)

- [ ] URL via `ConfigService`
- [ ] Tipagem explícita no `http.get<Tipo>()`
- [ ] `timeout(30_000)`
- [ ] `catchError` com log e mensagem amigável
- [ ] Mapeamento de DTO para modelo de domínio
- [ ] `HttpParams` para query strings
- [ ] Paginação quando a lista pode ser grande
- [ ] Sem estrutura raw da API no componente
