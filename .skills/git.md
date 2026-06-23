# Skill: Git

## Quando utilizar
Ao fazer commits, criar branches, abrir PRs ou revisar histórico de mudanças.

## Convenção de Branches

```
main            → produção (protegida)
desenv          → desenvolvimento / integração
feature/xxx     → nova funcionalidade
fix/xxx         → correção de bug
refactor/xxx    → refatoração
chore/xxx       → manutenção (deps, config)
docs/xxx        → documentação
```

## Commits (Conventional Commits)

Formato: `tipo(escopo): descrição em PT-BR`

```
feat(financeiro): adicionar filtro de data na listagem de prestações
fix(auth): corrigir redirect após expiração de token
refactor(prestacao-contas): extrair sub-componente de despesas
chore(deps): atualizar po-ui para 19.24.1
test(auth-service): adicionar testes de cenário de erro 401
docs(agents): atualizar endpoints mapeados do Protheus
perf(menu): aplicar OnPush na listagem de submenus
```

### Tipos
| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `perf` | Melhoria de performance |
| `test` | Adição/correção de testes |
| `chore` | Manutenção (deps, config, CI) |
| `docs` | Documentação |
| `style` | Formatação sem mudança de lógica |

## Escopos do Projeto

`auth`, `menu`, `financeiro`, `compras`, `orcamentos`, `consultas`, `admin`, `shared`, `config`, `deps`, `build`, `ci`

## Tamanho de Commits

- Um commit = uma mudança coesa
- Evitar commits "gigantes" com múltiplas features
- Cada commit deve compilar e passar os testes

## Pull Requests

```
Título: tipo(escopo): descrição curta (max 72 chars)

## O que mudou
- [bullet com cada mudança relevante]

## Por que mudou
- [motivação da mudança]

## Como testar
1. [passo 1]
2. [passo 2]

## Impacto
- [o que pode ser afetado por esta mudança]

## Checklist
- [ ] ng build passa
- [ ] ng lint passa
- [ ] Testes escritos/atualizados
- [ ] Revisão visual realizada
- [ ] Sem console.log
```

## Anti-patterns de Git

- Commits com `fix typo` + 200 linhas de mudança de lógica
- Mensagens genéricas: "ajustes", "correções", "melhorias"
- Commitar arquivos gerados (`dist/`, `.angular/cache/`)
- Commitar `environment.prod.ts` com credenciais
- Force push em `main` ou `desenv`
- Merge sem PR em branches protegidas

## .gitignore — Nunca Commitar

```
dist/
.angular/
node_modules/
*.env
environment.prod.ts  # se contiver secrets
```
