# Skill: Code Review

## Quando utilizar
Ao revisar PRs, fazer pair review com IA, ou antes de mergear qualquer código.

## Checklist Completo de Revisão

### Arquitetura
- [ ] Arquivo na pasta correta do domínio
- [ ] Service com responsabilidade única
- [ ] Componente não acessa localStorage diretamente
- [ ] Sem dependência circular entre domínios
- [ ] Rota com `loadComponent()` (lazy loading)
- [ ] Guard aplicado à rota quando necessário

### Angular
- [ ] `standalone: true` em componentes novos
- [ ] `ChangeDetectionStrategy.OnPush`
- [ ] `takeUntil(destroy$)` em todos os observables
- [ ] `ngOnDestroy` com `destroy$.next()` e `destroy$.complete()`
- [ ] `inject()` moderno (não construtor)
- [ ] Signals para estado local (não BehaviorSubject)
- [ ] `trackBy` em todos os `*ngFor`
- [ ] Typed Reactive Forms (não `any`)

### Segurança
- [ ] Sem `console.log` com dados sensíveis
- [ ] Sem token/senha em logs
- [ ] Sem `innerHTML` com input do usuário
- [ ] Inputs validados com Validators
- [ ] Mensagens de erro sem detalhes técnicos ao usuário

### Performance
- [ ] Sem chamadas HTTP dentro de loops
- [ ] Debounce em campos de busca (300ms)
- [ ] Sem `subscribe()` dentro de `subscribe()`
- [ ] Operador RxJS correto (switchMap vs concatMap vs mergeMap)

### UI/UX
- [ ] Componente PO-UI usado quando disponível
- [ ] Cores via variáveis CSS (não hardcode)
- [ ] Estado de loading implementado
- [ ] Estado vazio implementado
- [ ] Estado de erro com mensagem amigável
- [ ] Responsivo testado

### Qualidade
- [ ] Sem `any` não justificado
- [ ] Sem magic numbers (constantes nomeadas)
- [ ] Sem código comentado commitado
- [ ] Sem `TODO` sem issue linkada
- [ ] Sem duplicação de lógica existente
- [ ] Nomes expressivos (PT-BR para domínio)
- [ ] Funções com ≤ 20 linhas
- [ ] Componente com ≤ 400 linhas

### Testes
- [ ] Testes escritos para lógica nova em services
- [ ] Happy path coberto
- [ ] Cenário de erro coberto
- [ ] Sem `fit`/`fdescribe` commitados
- [ ] `ng test` passando

### Build
- [ ] `ng build` sem erros
- [ ] `ng lint` sem erros
- [ ] Budget não estourado (initial < 3MB)

## Severidade dos Achados

| Severidade | Exemplos | Ação |
|---|---|---|
| **Bloqueante** | Dados sensíveis em log, `any` em dados da API, sem `takeUntil` | Não pode mergear |
| **Obrigatório** | Sem `OnPush`, sem trackBy, componente > 400 linhas | Corrigir antes de merge |
| **Sugestão** | Extração de método, melhoria de nome | Pode mergear com issue aberta |

## Template de Comentário de Review

```
[BLOQUEANTE] auth.service.ts:87
Console.log expõe o token JWT completo. Remover ou substituir por log apenas do status.

[OBRIGATÓRIO] prestacao-contas.component.ts
Falta ChangeDetectionStrategy.OnPush. Adicionar ao @Component decorator.

[SUGESTÃO] meu-service.ts:45
O método `processar()` faz 3 coisas distintas. Considerar extrair em métodos menores.
```
