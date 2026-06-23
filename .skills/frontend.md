# Skill: Frontend

## Quando utilizar
Ao tomar decisões de implementação no frontend — escolha de abordagem para state management, formulários, comunicação entre componentes, ou integração com APIs.

## Decisões de Implementação

### Quando usar Signal vs Observable

| Cenário | Usar |
|---|---|
| Estado local do componente | `signal()` |
| Valor derivado de outro estado | `computed()` |
| Stream de eventos assíncronos | `Observable` |
| Resultado de chamada HTTP | `Observable` |
| Comunicação entre componente e template | `signal()` |
| Bus de eventos entre componentes | `Subject` / `BehaviorSubject` |

### Quando usar async pipe vs subscribe

```typescript
// PREFERIR async pipe (auto-unsubscribe)
// Template:
<div *ngIf="dados$ | async as dados">{{ dados.nome }}</div>

// USAR subscribe quando precisar de lógica adicional no componente
this.service.listar()
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: d => { this.items.set(d); this.calcularTotais(); },
    error: e => this.tratarErro(e)
  });
```

### Comunicação entre Componentes

```
Pai → Filho: @Input() ou signal via input()
Filho → Pai: @Output() EventEmitter
Irmãos: Service compartilhado com signal/BehaviorSubject
Global: Service no root (AuthService, MenuStateService)
```

### Formulários: Quando usar o quê

```
Formulário simples (1-3 campos): Template-driven (ngModel) aceitável
Formulário complexo com validação: Reactive Forms obrigatório
Formulário com campos dinâmicos: FormArray
Formulário multi-step: FormGroup aninhados por etapa
```

## Padrão de Componente Completo

```typescript
@Component({
  selector: 'app-lista-prestacoes',
  standalone: true,
  imports: [
    CommonModule,
    PoTableModule,
    PoButtonModule,
    PoLoadingModule,
  ],
  templateUrl: './lista-prestacoes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaPrestacoesComponent implements OnInit, OnDestroy {
  // Injeções
  private readonly service = inject(PrestacaoContasService);
  private readonly notification = inject(PoNotificationService);
  private readonly destroy$ = new Subject<void>();

  // Estado (signals)
  protected readonly isLoading = signal(false);
  protected readonly hasError = signal(false);
  protected readonly prestacoes = signal<Prestacao[]>([]);

  // Computed
  protected readonly hasPrestacoes = computed(() => this.prestacoes().length > 0);

  // Config da tabela (estático)
  protected readonly colunas: PoTableColumn[] = [
    { property: 'codigo', label: 'Código' },
    { property: 'status', label: 'Status', type: 'label', labels: this.statusLabels() },
  ];

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected carregar(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.service.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.prestacoes.set(data),
        error: () => {
          this.hasError.set(true);
          this.notification.error({ message: 'Erro ao carregar prestações.' });
        },
        complete: () => this.isLoading.set(false),
      });
  }

  protected trackById(_: number, item: Prestacao): string {
    return item.id;
  }

  private statusLabels(): PoTableColumnLabel[] {
    return [
      { value: 'P', label: 'Pendente', color: 'color-08' },
      { value: 'A', label: 'Aprovada', color: 'color-10' },
      { value: 'R', label: 'Reprovada', color: 'color-07' },
    ];
  }
}
```

## Limites de Linhas (Hard Limits)

- Componente `.ts`: **200 linhas** (exceção: até 400 com justificativa documentada)
- Template `.html`: **150 linhas** (extrair sub-componentes)
- Service: **150 linhas** (dividir por responsabilidade)
- Método: **20 linhas**

## Anti-patterns Frontend

- `ViewChild` para dados que poderiam ser passados via `@Input()`
- `setTimeout()` para timing/sincronização (usar RxJS `delay()` ou `timer()`)
- Mutar arrays diretamente com `push()` quando usando signals (usar `update()`)
- `Object.assign()` para imutabilidade (usar spread `{ ...obj, campo: novoValor }`)
- Formulário com `form.value as any`
- Template com expressões complexas (extrair para computed ou método)
