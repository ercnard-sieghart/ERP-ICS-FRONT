# AGENTS.md — Guia de Desenvolvimento para IAs

> Este arquivo é o contrato de arquitetura e qualidade do projeto **ERP ICS Front**.
> Toda IA (GitHub Copilot, Claude, Cursor, GPT, Gemini ou qualquer outra) que atuar neste repositório **deve ler e obedecer** este documento antes de escrever ou alterar qualquer linha de código.

---

## Visão Geral

### Objetivo do Projeto

O **ERP ICS Front** é uma aplicação Web Angular que serve como portal de integração com o ERP **TOTVS Protheus** do Instituto Clima e Sociedade (ICS). O sistema gerencia fluxos de:

- **Autenticação e Autorização** — OAuth2 integrado ao Protheus + sistema de Patentes (permissões)
- **Financeiro** — Prestação de contas, despesas, viagens e anexos
- **Compras** — Solicitação de compras
- **Orçamentos** — Análise e filtros de orçamento
- **Consultas** — Extrato bancário e relatórios
- **Administração** — Gestão de patentes e coordenação
- **BI** — Integração com Power BI e SmartView

### Stack Tecnológica

| Tecnologia | Versão | Papel |
|---|---|---|
| Angular | 19.x | Framework principal |
| TypeScript | 5.6.x | Linguagem |
| PO-UI (`@po-ui/ng-components`) | 19.24.x | Design System principal |
| Tailwind CSS | 3.3.x | Utilitários de layout/responsividade |
| SCSS | — | Estilos globais e variáveis |
| RxJS | 7.8.x | Reatividade |
| Zone.js | 0.15.x | Change detection |
| Karma + Jasmine | — | Testes unitários |

### Arquitetura

- **Standalone Components** (Angular 19+, sem NgModules)
- **Lazy Loading** por rota via `loadComponent()`
- **Feature Folders** — código agrupado por domínio de negócio
- **Smart / Dumb Components** — separação de lógica e apresentação
- **Interceptors** — autenticação via Bearer token
- **Guards** — controle de acesso por autenticação e patentes

### Princípios Arquiteturais

1. **SOLID** — Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
2. **DRY** — Nunca duplicar lógica; extrair para services ou utilitários
3. **KISS** — Prefer código simples e legível
4. **Clean Code** — Nomes expressivos, funções pequenas, sem comentários óbvios
5. **Clean Architecture** — Separação entre domínio, aplicação e infraestrutura
6. **Composition over Inheritance** — Preferir composição de serviços e diretivas
7. **Separation of Concerns** — Template só apresenta; service contém lógica; guard controla acesso

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── admin/                     # Módulo administrativo
│   │   └── patentes/              # Gestão de patentes (permissões)
│   ├── compras/                   # Módulo de compras
│   │   ├── services/              # Services do domínio compras
│   │   └── solicitacao-compras/   # Feature de solicitação
│   ├── consultas/                 # Módulo de consultas
│   │   └── services/              # Services do domínio consultas
│   ├── dashboard/                 # Dashboard com Power BI
│   ├── financeiro/                # Módulo financeiro (maior domínio)
│   │   └── services/              # Services financeiros
│   ├── home/                      # Página inicial
│   ├── login/                     # Autenticação
│   ├── orcamentos/                # Módulo de orçamentos + pipes customizados
│   ├── shared/                    # Código compartilhado entre domínios
│   │   ├── guards/                # Guards de autorização
│   │   ├── menu/                  # Componente de menu lateral
│   │   ├── models/                # Interfaces e modelos compartilhados
│   │   └── services/              # Services transversais (auth, config, menu-state)
│   ├── change-password/           # Troca de senha
│   ├── app.component.ts           # Root component (layout shell)
│   ├── app.config.ts              # Configuração standalone (providers globais)
│   ├── app.routes.ts              # Definição de todas as rotas
│   └── auth.guard.ts              # Guard de autenticação principal
├── environments/
│   ├── environment.ts             # Configuração de desenvolvimento
│   └── environment.prod.ts        # Configuração de produção
├── styles.scss                    # Estilos globais e variáveis CSS
├── main.ts                        # Bootstrap da aplicação
└── index.html                     # HTML raiz
```

### Regras de Organização

- **Domínios** ficam em `src/app/{dominio}/`
- **Services de domínio** ficam em `src/app/{dominio}/services/`
- **Componentes de domínio** ficam em `src/app/{dominio}/{feature}/`
- **Código transversal** fica em `src/app/shared/`
- **Rotas** são definidas exclusivamente em `app.routes.ts`
- **Providers globais** são declarados em `app.config.ts`

---

## Convenções

### Componentes

```typescript
// CORRETO — Standalone Component com OnPush
@Component({
  selector: 'app-meu-componente',
  standalone: true,
  imports: [CommonModule, PoButtonModule],
  templateUrl: './meu-componente.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeuComponenteComponent implements OnInit, OnDestroy {
  // 1. Injeções via inject()
  private readonly meuService = inject(MeuService);
  private readonly destroy$ = new Subject<void>();

  // 2. Signals para estado local
  protected readonly isLoading = signal(false);
  protected readonly items = signal<Item[]>([]);

  // 3. Computed signals
  protected readonly hasItems = computed(() => this.items().length > 0);

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregar(): void {
    this.isLoading.set(true);
    this.meuService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.items.set(data),
        error: (err) => this.tratarErro(err),
        complete: () => this.isLoading.set(false),
      });
  }
}
```

### Páginas (Smart Components)

- Responsáveis pela orquestração de dados e lógica
- Injetam services e passam dados para componentes filhos via `@Input()`
- Gerenciam o estado da página com Signals
- Implementam ciclos de vida do Angular

### Services

```typescript
// CORRETO — Service injetável no root
@Injectable({ providedIn: 'root' })
export class MeuService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  listar(): Observable<Item[]> {
    return this.http.get<ApiResponse<Item[]>>(
      this.config.getRestEndpoint('MEUENDPOINT')
    ).pipe(
      map(response => response.items ?? []),
      catchError(this.tratarErro.bind(this))
    );
  }

  private tratarErro(error: HttpErrorResponse): Observable<never> {
    // Log sem dados sensíveis
    console.error('[MeuService] Erro ao listar:', error.status);
    return throwError(() => error);
  }
}
```

### Interfaces e Models

```typescript
// src/app/shared/models/meu-dominio.models.ts

// Interface para entidade de domínio
export interface MinhaEntidade {
  readonly id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
}

// DTO para requisição
export interface MinhaEntidadeRequestDto {
  nome: string;
  codigo: string;
}

// DTO para resposta da API
export interface MinhaEntidadeResponseDto {
  items: MinhaEntidade[];
  total: number;
  hasNext: boolean;
}
```

### Enums

```typescript
// src/app/shared/models/meu-dominio.enums.ts
export enum StatusPrestacao {
  Pendente = 'P',
  Aprovada = 'A',
  Reprovada = 'R',
  EmAnalise = 'E',
}
```

### Rotas

```typescript
// app.routes.ts — padrão obrigatório
{
  path: 'meu-modulo',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./meu-modulo/meu-modulo.component')
      .then(m => m.MeuModuloComponent),
},
```

### Guards

```typescript
// Guards como funções (Angular 14.2+)
export const meuGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

### Interceptors

```typescript
// Interceptors como funções (Angular 15+)
export const meuInterceptor: HttpInterceptorFn = (req, next) => {
  // lógica
  return next(modifiedReq);
};
```

### Pipes

```typescript
@Pipe({ name: 'meuPipe', standalone: true, pure: true })
export class MeuPipe implements PipeTransform {
  transform(value: string[], filtro: string): string[] {
    if (!filtro) return value;
    return value.filter(v => v.includes(filtro));
  }
}
```

### Utilitários

- Colocar em `src/app/shared/utils/`
- Funções puras, sem estado
- Exportar como funções nomeadas (não classes)

---

## Convenções de Nomenclatura

### Arquivos

| Tipo | Padrão | Exemplo |
|---|---|---|
| Componente | `nome-kebab.component.ts` | `prestacao-contas.component.ts` |
| Template | `nome-kebab.component.html` | `prestacao-contas.component.html` |
| Estilos | `nome-kebab.component.scss` | `prestacao-contas.component.scss` |
| Service | `nome-kebab.service.ts` | `auth.service.ts` |
| Guard | `nome-kebab.guard.ts` | `auth.guard.ts` |
| Interceptor | `nome-kebab.interceptor.ts` | `auth.interceptor.ts` |
| Pipe | `nome-kebab.pipe.ts` | `filter-ano.pipe.ts` |
| Model/Interface | `nome-kebab.models.ts` | `patentes.models.ts` |
| Enum | `nome-kebab.enums.ts` | `status-prestacao.enums.ts` |
| DTO | `nome-kebab.dto.ts` | `prestacao-contas.dto.ts` |
| Util | `nome-kebab.utils.ts` | `date.utils.ts` |

### Classes e Interfaces

| Tipo | Padrão | Exemplo |
|---|---|---|
| Componente | `PascalCase` + sufixo `Component` | `PrestacaoContasComponent` |
| Service | `PascalCase` + sufixo `Service` | `AuthService` |
| Guard (função) | `camelCase` + sufixo `Guard` | `authGuard` |
| Interceptor (função) | `camelCase` + sufixo `Interceptor` | `authInterceptor` |
| Interface | `PascalCase` sem prefixo `I` | `MenuItem`, `Patente` |
| DTO | `PascalCase` + sufixo `Dto` | `PrestacaoContasRequestDto` |
| Enum | `PascalCase` | `StatusPrestacao` |
| Pipe | `PascalCase` + sufixo `Pipe` | `FilterAnoPipe` |

### Métodos e Propriedades

| Tipo | Padrão | Exemplo |
|---|---|---|
| Método público | `camelCase`, verbo + substantivo | `listarPrestacoes()`, `buscarParticipante()` |
| Método privado | `camelCase`, verbo | `tratarErro()`, `mapearResposta()` |
| Signal (estado) | `camelCase` sem prefixo | `isLoading`, `items`, `selectedItem` |
| Computed | `camelCase` | `hasItems`, `totalValor` |
| Observable | `camelCase` + sufixo `$` | `prestacoes$`, `destroy$` |
| Constante módulo | `SCREAMING_SNAKE_CASE` | `MAX_TENTATIVAS`, `TIMEOUT_MS` |
| Input | `camelCase` | `@Input() prestacao: Prestacao` |
| Output | `camelCase` no padrão `eventName` | `@Output() prestacaoSalva = new EventEmitter()` |

---

## Padrões Obrigatórios

### SOLID

**S — Single Responsibility:** cada classe/função tem uma única razão para mudar. Um componente não mistura lógica de negócio com apresentação.

**O — Open/Closed:** extensível sem modificação. Usar composição, não herança.

**L — Liskov Substitution:** interfaces implementadas de forma completa e correta.

**I — Interface Segregation:** interfaces pequenas e específicas, não um "God Interface".

**D — Dependency Inversion:** depender de abstrações (interfaces/tokens), não de implementações concretas.

### Smart vs Dumb Components

**Smart (Container):**
- Páginas e contêineres principais
- Injetam services
- Gerenciam estado
- Passam dados para filhos via `@Input()`
- Recebem eventos via `@Output()`

**Dumb (Presentational):**
- Recebem apenas dados via `@Input()`
- Emitem apenas eventos via `@Output()`
- Não injetam services de domínio
- `ChangeDetectionStrategy.OnPush` obrigatório

### Proibições

- **NUNCA** usar `any` sem justificativa
- **NUNCA** usar `// @ts-ignore` sem comentário explicativo
- **NUNCA** colocar lógica de negócio no template
- **NUNCA** acessar `localStorage` diretamente em componentes (usar service)
- **NUNCA** usar `document.querySelector` ou DOM manipulation direto (usar Renderer2 ou diretivas)
- **NUNCA** deixar `console.log` em código de produção
- **NUNCA** duplicar código (extrair para utilitário/service)
- **NUNCA** criar componente com mais de ~400 linhas sem refatorar

---

## Padrões Angular

### Signals (Preferido)

```typescript
// Estado local — signal()
protected readonly isLoading = signal(false);

// Derivado — computed()
protected readonly label = computed(() =>
  this.isLoading() ? 'Carregando...' : 'Carregar'
);

// Efeito colateral — effect() (usar com cautela)
constructor() {
  effect(() => {
    if (this.isLoading()) {
      this.analytics.track('loading_started');
    }
  });
}
```

### RxJS

```typescript
// CORRETO — unsubscribe com takeUntil
private readonly destroy$ = new Subject<void>();

ngOnInit(): void {
  this.service.dados$
    .pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(termo => this.service.buscar(termo)),
      catchError(err => { this.notificarErro(err); return EMPTY; })
    )
    .subscribe(dados => this.items.set(dados));
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### ChangeDetection OnPush

Todo componente novo deve declarar `changeDetection: ChangeDetectionStrategy.OnPush`.

### Dependency Injection

```typescript
// CORRETO — inject() moderno
private readonly service = inject(MeuService);

// EVITAR — construtor verboso (ainda válido, mas menos idiomático no Angular 19)
constructor(private service: MeuService) {}
```

### Formulários Reativos com Tipagem

```typescript
// CORRETO — Typed Reactive Forms
protected readonly form = new FormGroup({
  nome: new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(100)]
  }),
  valor: new FormControl<number | null>(null, [Validators.min(0)]),
});

// Acesso tipado
const nome: string = this.form.controls.nome.value;
```

### HTTP e Observables

```typescript
// CORRETO — tipagem da resposta
this.http.get<PrestacaoDto[]>('/rest/PRESTACAOCONTA')

// CORRETO — tratar erro no service, não no componente
.pipe(catchError(this.tratarErro))

// CORRETO — operador correto para cada cenário
switchMap  // troca requisições (busca com digitação)
concatMap  // sequência (upload em fila)
mergeMap   // paralelo sem ordem
exhaustMap // ignora novas enquanto a atual está pendente (login)
```

---

## UI — Identidade Visual Obrigatória

### Variáveis de Cor (CSS)

```scss
// Usar sempre as variáveis definidas — NUNCA hardcode de cor
--primary: #1A4E79;     // Azul institucional
--secondary: #75C9C8;   // Teal
--gradient: linear-gradient(135deg, #1A4E79 0%, #75C9C8 100%);
--hover-bg: rgba(117, 201, 200, 0.1);
```

### Ordem de Prioridade para Componentes UI

1. **PO-UI** (`@po-ui/ng-components`) — sempre a primeira escolha
2. **Classes Tailwind** — para layout, espaçamento e responsividade
3. **Classes Globais** (definidas em `styles.scss`) — `.btn-primary-blue`, `.status-tag`, `.valor-monetario`
4. **CSS customizado no componente** — somente como último recurso

### Regras de UI

- **NUNCA** criar estilos que sobrescrevam o tema PO-UI globalmente
- **SEMPRE** usar as classes utilitárias existentes antes de criar novas
- **SEMPRE** verificar responsividade no breakpoint 680px (menu collapse)
- **SEMPRE** testar dark/light compatibilidade com PO-UI Theme
- **NUNCA** usar cores hardcoded no template; usar variáveis CSS ou classes Tailwind

### Componentes PO-UI Mapeados no Projeto

| Componente | Uso |
|---|---|
| `po-button` | Botões de ação |
| `po-table` | Tabelas de dados |
| `po-modal` | Modais de confirmação e formulário |
| `po-notification` | Toasts / alertas |
| `po-toolbar` | Barra superior |
| `po-field` / `po-input` | Campos de formulário |
| `po-select` | Selects |
| `po-combo` | Autocomplete |
| `po-icon` | Ícones |
| `po-loading` | Loading states |

---

## Segurança (Obrigatório)

### OWASP Top 10 — Aplicação Angular

#### A01 — Broken Access Control
- Todos os endpoints protegidos requerem `authGuard`
- Rotas com funcionalidade restrita requerem também `patenteGuard`
- Validação de permissão deve ocorrer TAMBÉM no backend
- **NUNCA** confiar apenas na validação do frontend

#### A02 — Cryptographic Failures
- **NUNCA** armazenar senha em qualquer storage
- **NUNCA** logar tokens, senhas ou dados sensíveis
- Tokens JWT devem ser transmitidos apenas via HTTPS
- **EVITAR** `localStorage` para tokens sensíveis de longa duração (prefira `sessionStorage` ou cookies HttpOnly)

#### A03 — Injection
- Angular escapa automaticamente templates via data binding (`{{ }}`)
- **NUNCA** usar `innerHTML` com dados do usuário
- Se necessário `innerHTML`, usar `DomSanitizer.sanitizeHtml()`
- Validar todos os inputs no formulário antes de enviar ao backend

#### A05 — Security Misconfiguration
- Variáveis de ambiente de produção **nunca** devem aparecer em logs
- `sourceMap: false` em produção (já configurado)
- Remover endpoints de debug antes de deploy

#### A07 — Identification and Authentication Failures
- Timeout de inatividade: 15 minutos (já implementado no login)
- Logout limpa `localStorage` completamente
- Tokens expirados → redirecionar para `/login`
- O interceptor já trata erro 401 com logout automático

#### XSS Prevention
```typescript
// PROIBIDO
element.innerHTML = userInput;

// CORRETO — Angular escapa automaticamente
<p>{{ userInput }}</p>

// Se obrigatório HTML dinâmico
import { DomSanitizer } from '@angular/platform-browser';
const safeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
// Usar somente com HTML de fonte confiável
```

#### CSRF
- Angular `HttpClient` não envia cookies por padrão
- O sistema usa Bearer token (imune a CSRF tradicional)
- Se precisar cookies: implementar `XSRF-TOKEN`

#### Token Storage
```typescript
// Acesso ao token SEMPRE via AuthService — NUNCA diretamente
const token = this.authService.getToken(); // CORRETO
const token = localStorage.getItem('authToken'); // PROIBIDO em componentes
```

#### Logs Seguros
```typescript
// PROIBIDO
console.log('Token:', token);
console.log('Usuário:', usuario);

// CORRETO
console.error('[AuthService] Falha de autenticação:', error.status);
console.warn('[PatenteGuard] Acesso negado para rota:', rota);
```

#### Armazenamento
| Dado | Storage Correto |
|---|---|
| Token de acesso | `localStorage` (atual) ou `sessionStorage` |
| Dados do usuário | `localStorage` |
| Dados sensíveis | **Nunca no browser** |
| Cache de menus | `localStorage` com TTL |

---

## Integração com Protheus

### Padrões de Endpoint

```typescript
// ConfigService centraliza URLs
const url = this.config.getRestEndpoint('MEUENDPOINT');
// Dev: http://localhost:8181/rest/MEUENDPOINT (via proxy)
// Prod: https://...protheus.cloudtotvs.com.br:4050/rest/MEUENDPOINT
```

### Paginação

```typescript
// Protheus usa pageSize e page
const params = new HttpParams()
  .set('page', pageNumber.toString())
  .set('pageSize', '20');
```

### Timeout e Retry

```typescript
this.http.get(url).pipe(
  timeout(30_000),  // 30s máximo para Protheus
  retry({ count: 2, delay: 1000 }),  // 2 retentativas com 1s de delay
  catchError(this.tratarErro.bind(this))
)
```

### Tratamento de Erro Protheus

```typescript
// Protheus retorna erros em formatos variados
interface ProtheusError {
  code?: string;
  message?: string;
  detailedMessage?: string;
  helpUrl?: string;
}
```

### Autenticação OAuth2 Protheus

1. `POST /api/oauth2/v1/token` com `grant_type=password`
2. Retorna `access_token` (JWT)
3. Todas as chamadas seguintes: `Authorization: Bearer {access_token}`
4. Interceptor `auth.interceptor.ts` já injeta o header

### Idempotência

- `GET` — sempre idempotente (pode fazer retry)
- `POST` — verificar se o backend suporta idempotency key antes de retry
- `PUT` — idempotente por natureza (retry seguro)
- `DELETE` — testar se o backend retorna 200 ou 404 em deleção duplicada

---

## Performance

### Checklist de Performance (obrigatório por feature)

- [ ] `ChangeDetectionStrategy.OnPush` no componente
- [ ] `trackBy` em todos os `*ngFor`
- [ ] `async` pipe no template em vez de subscribe manual quando possível
- [ ] Lazy loading da rota com `loadComponent()`
- [ ] `takeUntil` em todos os observables (evitar memory leaks)
- [ ] Signals em vez de BehaviorSubject para estado simples
- [ ] Pipes `pure: true` (padrão — nunca usar `pure: false` sem necessidade)
- [ ] Imagens com `loading="lazy"` e dimensões explícitas
- [ ] Debounce em campos de busca (mínimo 300ms)

### Lazy Loading

```typescript
// CORRETO — loadComponent para cada rota
{
  path: 'financeiro/prestacao-contas',
  loadComponent: () =>
    import('./financeiro/prestacao-contas.component')
      .then(m => m.PrestacaoContasComponent),
}
```

### Bundle Budget

Configurado em `angular.json`:
- Initial: warning 3MB / error 5MB
- Component styles: warning 4KB / error 6KB
- Manter o bundle inicial abaixo de 3MB

---

## Qualidade

### ESLint

O projeto usa `@angular-eslint`. Antes de commitar:
```bash
ng lint
```

### Prettier

Formatar antes de commitar:
```bash
npx prettier --write "src/**/*.{ts,html,scss}"
```

### Testes Unitários

- Framework: Karma + Jasmine
- Executar: `ng test`
- **Cobertura mínima obrigatória: 70%** para novos serviços e pipes

```typescript
// Padrão mínimo de teste para services
describe('MeuService', () => {
  let service: MeuService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MeuService, provideHttpClientTesting()]
    });
    service = TestBed.inject(MeuService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve listar itens', () => {
    // Arrange
    const mockItems = [{ id: '1', nome: 'Teste' }];

    // Act
    service.listar().subscribe(items => {
      // Assert
      expect(items).toEqual(mockItems);
    });

    // Mock HTTP
    const req = httpMock.expectOne('/rest/MEUENDPOINT');
    expect(req.request.method).toBe('GET');
    req.flush(mockItems);
  });
});
```

### Definition of Done (DoD)

Uma task só está concluída quando:

- [ ] Código compila sem erros (`ng build`)
- [ ] Sem erros de lint (`ng lint`)
- [ ] Testes unitários escritos para lógica nova
- [ ] Testes passando (`ng test`)
- [ ] Identidade visual preservada (revisão visual)
- [ ] Responsividade testada (mobile + desktop)
- [ ] Sem `console.log` ou código de debug
- [ ] PR revisado por ao menos 1 engenheiro
- [ ] Merge com `main` sem conflitos

### Pull Requests

- Título: `tipo(escopo): descrição curta` — ex: `feat(financeiro): adicionar filtro de data na prestação`
- Tipos: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `perf`
- Descrição: o QUE mudou, POR QUE mudou e COMO testar
- Máximo 400 linhas por PR (preferir PRs menores)

---

## Regras para IAs

### Antes de Qualquer Alteração

1. **Ler este AGENTS.md** completamente
2. **Mapear os arquivos relacionados** à feature que será criada/modificada
3. **Identificar componentes e serviços reutilizáveis** existentes
4. **Verificar as rotas** existentes em `app.routes.ts`
5. **Entender a identidade visual** via `styles.scss` e componentes PO-UI existentes

### Durante o Desenvolvimento

- Reutilizar componentes PO-UI existentes antes de criar novos
- Seguir o padrão de nomenclatura exato definido neste documento
- Aplicar `ChangeDetectionStrategy.OnPush` em todo componente novo
- Usar Signals para estado local, RxJS para streams assíncronas
- Tipar explicitamente — `any` deve ser justificado com comentário
- Manter services com responsabilidade única
- Não introduzir dependências novas sem discussão com o time

### Proibido para IAs

- Introduzir novo design system ou biblioteca CSS não aprovada
- Refatorar código fora do escopo da tarefa
- Alterar `app.config.ts` ou `app.routes.ts` sem revisar impacto total
- Usar `localStorage` diretamente em componentes
- Criar componentes com mais de 400 linhas sem dividir
- Deixar código experimental ou `TODO` sem issue linkada
- Implementar features não solicitadas
- Alterar configurações de build ou ambiente sem aprovação

### Ao Finalizar

- Confirmar que `ng build` e `ng lint` passam sem erros
- Descrever exatamente o que foi alterado e o impacto
- Listar arquivos modificados e criados
- Indicar se há débito técnico introduzido
- Sugerir testes para a funcionalidade entregue

### IA em Revisão de Código

Ao revisar código, a IA deve verificar:
- Violações de SOLID
- Componentes sem `OnPush`
- Observables sem `takeUntil`
- `any` não justificado
- Código duplicado
- Logs com dados sensíveis
- Falta de tipagem
- Violações de identidade visual

### IA em Geração de Testes

- Gerar testes unitários para services e pipes
- Usar `HttpTestingController` para mocks de HTTP
- Testar cenários de erro além de happy path
- Nomear testes em português descritivo: `'deve retornar lista vazia quando não há resultados'`

---

## Roadmap Evolutivo

### Curto Prazo (0–3 meses)
1. Refatorar `PrestacaoContasComponent` (1784 linhas) em sub-componentes
2. Centralizar todas as interfaces em `src/app/shared/models/`
3. Adicionar testes unitários nos services existentes
4. Remover `console.log` de produção com interceptor de ambiente
5. Documentar todos os endpoints REST consumidos

### Médio Prazo (3–6 meses)
1. Implementar gerenciamento de estado centralizado (NgRx Signals ou Akita)
2. Criar interceptor global de tratamento de erros com notificação
3. Adicionar PWA support (Service Worker, offline cache)
4. Implementar retry automático com exponential backoff nas chamadas HTTP
5. Migrar armazenamento de token para `sessionStorage` ou cookie HttpOnly

### Longo Prazo (6–12 meses)
1. CI/CD pipeline completo (lint → test → build → deploy)
2. Storybook para documentação visual dos componentes compartilhados
3. Cobertura de testes ≥ 80%
4. Auditoria de acessibilidade (WCAG 2.1 AA)
5. Monitoramento de performance real (Lighthouse CI)
6. Versionamento de API com fallback gracioso
