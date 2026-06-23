# Skill: Testing

## Quando utilizar
Ao criar testes unitários para services, pipes, guards ou componentes. Ao revisar cobertura de testes de uma feature nova.

## Framework

- **Karma** (test runner) + **Jasmine** (assertions)
- Executar: `ng test`
- Coverage: `ng test --code-coverage`
- Cobertura mínima obrigatória: **70% para services e pipes novos**

## Padrão para Services

```typescript
describe('PrestacaoContasService', () => {
  let service: PrestacaoContasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PrestacaoContasService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(PrestacaoContasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve retornar lista de prestações', () => {
    const mock = [{ codigo: 'P001', status: 'P' }];

    service.listar().subscribe(result => {
      expect(result).toEqual(mock);
      expect(result.length).toBe(1);
    });

    const req = httpMock.expectOne('/rest/PRESTACAOCONTA');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('deve retornar array vazio quando servidor retornar erro 404', () => {
    service.listar().subscribe({
      error: (err) => expect(err.status).toBe(404)
    });

    httpMock.expectOne('/rest/PRESTACAOCONTA')
      .flush('Not Found', { status: 404, statusText: 'Not Found' });
  });
});
```

## Padrão para Pipes

```typescript
describe('FilterAnoPipe', () => {
  let pipe: FilterAnoPipe;

  beforeEach(() => pipe = new FilterAnoPipe());

  it('deve filtrar itens por ano', () => {
    const items = [{ ano: '2024' }, { ano: '2023' }];
    expect(pipe.transform(items, '2024')).toEqual([{ ano: '2024' }]);
  });

  it('deve retornar todos quando filtro vazio', () => {
    const items = [{ ano: '2024' }, { ano: '2023' }];
    expect(pipe.transform(items, '')).toEqual(items);
  });

  it('deve retornar array vazio para filtro sem resultado', () => {
    const items = [{ ano: '2024' }];
    expect(pipe.transform(items, '2099')).toEqual([]);
  });
});
```

## Padrão para Guards

```typescript
describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['isAuthenticated']) },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['createUrlTree']) },
      ]
    });
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('deve permitir acesso quando autenticado', () => {
    authService.isAuthenticated.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    expect(result).toBeTrue();
  });

  it('deve redirecionar para login quando não autenticado', () => {
    authService.isAuthenticated.and.returnValue(false);
    router.createUrlTree.and.returnValue(new UrlTree());
    TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
```

## Nomes de Testes (em PT-BR)

```
deve {fazer algo} quando {condição}
deve retornar {resultado} para {entrada}
deve emitir {evento} ao {ação}
deve redirecionar para {rota} quando {condição}
deve exibir {elemento} quando {condição}
```

## Anti-patterns de Testes

- Testes que dependem de ordem de execução
- `it('test1', ...)` sem descrição significativa
- Mocks que não refletem o contrato real da API
- Testar apenas happy path (sempre incluir cenário de erro)
- `fit()` ou `fdescribe()` commitados (focam apenas aquele teste)
- Testes sem `afterEach(() => httpMock.verify())`

## Checklist de Testes (nova feature)

- [ ] Service: happy path testado
- [ ] Service: cenário de erro 4xx testado
- [ ] Service: cenário de erro de rede testado
- [ ] Pipes: todas as combinações de entrada testadas
- [ ] Guards: acesso permitido e negado testados
- [ ] `httpMock.verify()` em `afterEach`
- [ ] Nomes de testes descritivos em PT-BR
- [ ] Sem `fit`/`fdescribe` commitados
