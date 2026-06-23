# Skill: Clean Code

## Quando utilizar
Em qualquer escrita ou revisão de código TypeScript/HTML/SCSS neste projeto.

## Princípios

### Nomes Expressivos
```typescript
// RUIM
const d = new Date();
const x = items.filter(i => i.s === 'A');
function proc(data: any): any { }

// BOM
const dataAtual = new Date();
const itensAtivos = items.filter(item => item.status === StatusPrestacao.Aprovada);
function mapearPrestacaoParaDto(prestacao: Prestacao): PrestacaoRequestDto { }
```

### Funções Pequenas (Single Responsibility)
```typescript
// RUIM — função faz tudo
salvarPrestacao(): void {
  this.validarFormulario();
  const dto = { ...this.form.value };
  this.http.post('/rest/PRESTACAOCONTA', dto).subscribe(res => {
    this.notification.success({ message: 'Salvo!' });
    this.router.navigate(['/financeiro/minhas-prestacoes']);
    this.form.reset();
    this.isLoading.set(false);
  });
}

// BOM — cada função tem uma responsabilidade
salvarPrestacao(): void {
  if (!this.formularioValido()) return;
  this.isLoading.set(true);
  this.service.criar(this.montarDto())
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => this.onSalvoComSucesso(),
      error: (e) => this.onErroAoSalvar(e),
    });
}

private montarDto(): PrestacaoRequestDto {
  return { ...this.form.value };
}

private onSalvoComSucesso(): void {
  this.notification.success({ message: 'Prestação salva com sucesso!' });
  this.router.navigate(['/financeiro/minhas-prestacoes']);
}
```

### Sem Comentários Óbvios
```typescript
// RUIM
// Incrementa o contador
this.contador++;

// BOM — código autoexplicativo, sem comentário
this.contador++;

// BOM — comentário que explica o POR QUÊ não óbvio
// Protheus retorna 302 quando usuário precisa trocar senha no primeiro acesso
if (response.status === 302) {
  this.router.navigate(['/change-password']);
}
```

### Sem Magic Numbers
```typescript
// RUIM
if (token.length > 10) { }
setTimeout(() => this.logout(), 900_000);

// BOM
const TOKEN_LENGTH_MINIMO = 10;
const TIMEOUT_INATIVIDADE_MS = 15 * 60 * 1000; // 15 minutos

if (token.length > TOKEN_LENGTH_MINIMO) { }
setTimeout(() => this.logout(), TIMEOUT_INATIVIDADE_MS);
```

### DRY — Não Repetir
```typescript
// RUIM — mesmo tratamento de erro em 3 services
catchError(err => {
  console.error('Erro:', err.status);
  return throwError(() => err);
})

// BOM — utilitário compartilhado
// src/app/shared/utils/http-error.utils.ts
export function tratarErroHttp(context: string) {
  return (error: HttpErrorResponse): Observable<never> => {
    console.error(`[${context}] Erro HTTP:`, error.status);
    return throwError(() => error);
  };
}
// Uso: catchError(tratarErroHttp('PrestacaoService'))
```

### Evitar Negações Aninhadas
```typescript
// RUIM
if (!isLoading) {
  if (!hasError) {
    if (items.length > 0) {
      // render
    }
  }
}

// BOM — early return / guard clauses
if (isLoading || hasError || items.length === 0) return;
// render
```

## Limites de Tamanho

| Artefato | Limite Recomendado | Ação |
|---|---|---|
| Função/método | 20 linhas | Extrair sub-funções |
| Componente (.ts) | 200 linhas | Extrair sub-componentes |
| Template (.html) | 150 linhas | Extrair sub-componentes |
| Service | 150 linhas | Dividir por responsabilidade |
| Arquivo | 400 linhas | Sempre dividir |

## Anti-patterns

- Métodos com mais de 3 parâmetros (criar interface/DTO)
- Booleanos como parâmetros (`processar(true, false, true)`)
- `else` desnecessário após `return`
- Código comentado commitado
- TODO sem issue linkada (`// TODO: https://github.com/.../issues/123`)
- Strings mágicas espalhadas (extrair para constante/enum)

## Checklist Clean Code (por PR)

- [ ] Sem `any` não justificado
- [ ] Sem magic numbers ou strings
- [ ] Funções com nome expressivo e responsabilidade única
- [ ] Sem código comentado
- [ ] Sem `console.log` de debug
- [ ] Sem duplicação de lógica
- [ ] Early returns / guard clauses quando aplicável
- [ ] Parâmetros de função < 4 (usar objeto se mais)
