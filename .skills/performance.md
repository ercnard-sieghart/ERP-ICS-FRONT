# Skill: Performance

## Quando utilizar
Ao criar novos componentes, listas, formulários, chamadas HTTP, ou ao investigar lentidão e bundles grandes.

## Checklist Obrigatório (todo componente novo)

- [ ] `ChangeDetectionStrategy.OnPush`
- [ ] `trackBy` em todos os `*ngFor`
- [ ] `async` pipe no template quando possível
- [ ] Lazy loading na rota com `loadComponent()`
- [ ] Sem `subscribe()` órfão (sempre `takeUntil` ou `async`)
- [ ] Debounce 300ms em campos de busca

## Padrões de Performance

### OnPush + Signals
```typescript
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class ListaComponent {
  protected readonly items = signal<Item[]>([]);
  protected readonly isLoading = signal(false);
  // Angular só re-renderiza quando signal muda — muito mais eficiente
}
```

### trackBy em listas
```typescript
// CORRETO
<li *ngFor="let item of items(); trackBy: trackById">

protected trackById(index: number, item: Item): string {
  return item.id;
}

// ERRADO — re-cria todos os elementos em cada change detection
<li *ngFor="let item of items()">
```

### async pipe (evita subscribe manual)
```html
<!-- CORRETO — auto-unsubscribe -->
<div *ngIf="prestacoes$ | async as prestacoes">
  <li *ngFor="let p of prestacoes; trackBy: trackById">{{ p.nome }}</li>
</div>

<!-- EVITAR quando signal resolver -->
```

### Debounce em busca
```typescript
protected readonly termoBusca = signal('');

// RxJS com debounce
private readonly busca$ = toObservable(this.termoBusca).pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(termo => this.service.buscar(termo))
);
```

### Cache de dados
```typescript
// Usar shareReplay para evitar múltiplas chamadas HTTP
this.http.get<Item[]>(url).pipe(
  shareReplay({ bufferSize: 1, refCount: true })
)
```

### Lazy Loading de Imagens
```html
<img [src]="item.foto" [alt]="item.nome" loading="lazy" width="64" height="64">
```

### Bundle Size
- Não importar bibliotecas inteiras — importar só o que usa
- `@po-ui/ng-components` — importar apenas módulos necessários por componente
- Verificar após cada build: `ng build --stats-json` e analisar com webpack-bundle-analyzer

## Anti-patterns de Performance

- `ChangeDetectionStrategy.Default` em componentes novos
- `*ngFor` sem `trackBy`
- `subscribe()` sem `takeUntil` (memory leak)
- `setInterval()` sem `clearInterval()` no `ngOnDestroy`
- Chamada HTTP dentro de `*ngFor` no template
- Importar módulo inteiro quando só usa uma função
- `JSON.parse(JSON.stringify(obj))` para deep clone (usar `structuredClone()`)

## Métricas-alvo

| Métrica | Alvo |
|---|---|
| First Contentful Paint | < 2s |
| Initial Bundle | < 3MB |
| Component styles | < 4KB por componente |
| Debounce busca | 300ms |
| Timeout Protheus | 30s |
