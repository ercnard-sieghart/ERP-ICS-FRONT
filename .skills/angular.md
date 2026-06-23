# Skill: Angular

## Quando utilizar
Ao criar componentes, services, guards, interceptors, pipes, diretivas ou qualquer artefato Angular. Ao migrar padrões legados ou ao decidir entre abordagens reativas.

## Boas Práticas

### Standalone Components (Angular 19)
- Sempre `standalone: true` — sem NgModules
- Declarar `imports` apenas o que o template precisa
- `changeDetection: ChangeDetectionStrategy.OnPush` obrigatório

### Signals (estado local preferido)
```typescript
protected readonly count = signal(0);
protected readonly double = computed(() => this.count() * 2);
// Atualizar
this.count.set(1);
this.count.update(c => c + 1);
```

### RxJS (streams assíncronas)
```typescript
// Sempre destruir com takeUntil
private readonly destroy$ = new Subject<void>();
stream$.pipe(takeUntil(this.destroy$)).subscribe();
// ngOnDestroy: this.destroy$.next(); this.destroy$.complete();

// Operador certo para o caso:
switchMap   // cancela anterior (busca)
concatMap   // aguarda término (sequência)
exhaustMap  // ignora novas (login/submit)
mergeMap    // paralelo (uploads)
```

### Injeção de Dependência
```typescript
// Prefira inject() sobre construtor no Angular 19
private readonly service = inject(MeuService);
```

### Formulários
```typescript
// Typed Reactive Forms — sempre
const form = new FormGroup({
  nome: new FormControl<string>('', { nonNullable: true }),
});
```

### HTTP
```typescript
// Sempre tipar o retorno
this.http.get<MinhaInterface[]>('/endpoint')
// Sempre tratar erro no service (não no componente)
.pipe(catchError(this.handleError.bind(this)))
```

### Lazy Loading
```typescript
// Sempre loadComponent() em rotas
loadComponent: () => import('./meu.component').then(m => m.MeuComponent)
```

## Anti-patterns

- `NgModule` para código novo
- `DefaultChangeDetection` (sem OnPush)
- `subscribe()` sem `takeUntil` ou `async` pipe
- `any` sem justificativa
- Lógica de negócio no template
- `document.querySelector` direto
- `new HttpClient()` direto (sempre injetar)
- Usar `tap()` para efeitos colaterais que deveriam estar no `subscribe()`

## Checklist

- [ ] `standalone: true`
- [ ] `ChangeDetectionStrategy.OnPush`
- [ ] `takeUntil(this.destroy$)` em todos os observables
- [ ] Signals para estado local
- [ ] Typed Forms
- [ ] `inject()` moderno
- [ ] `loadComponent()` na rota
- [ ] Sem `any` não justificado
- [ ] Sem lógica no template
