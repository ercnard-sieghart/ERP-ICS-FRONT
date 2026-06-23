# Skill: Architecture

## Quando utilizar
Ao criar nova feature, decidir onde colocar um arquivo, refatorar código existente, ou avaliar se uma abordagem respeita a arquitetura do projeto.

## Estrutura de Domínios

```
src/app/
├── {dominio}/                  # admin, compras, consultas, financeiro, orcamentos
│   ├── services/               # Services exclusivos do domínio
│   └── {feature}/              # Componentes da feature
├── shared/                     # Código transversal
│   ├── guards/                 # Guards reutilizáveis
│   ├── menu/                   # Componente de menu
│   ├── models/                 # Interfaces e enums compartilhados
│   └── services/               # Services transversais (auth, config, menu-state)
├── app.config.ts               # Providers globais
├── app.routes.ts               # Todas as rotas
└── auth.guard.ts               # Guard principal de autenticação
```

## Regras de Camadas

| Camada | Responsabilidade | NÃO pode |
|---|---|---|
| Template (.html) | Apresentar dados | Lógica, chamadas HTTP |
| Component (.ts) | Orquestrar UI e estado | Lógica de negócio complexa |
| Service | Lógica de negócio + HTTP | Manipular DOM |
| Guard | Controle de acesso | Lógica de negócio |
| Interceptor | Cross-cutting concerns | Lógica de domínio |
| Model | Tipagem de dados | Lógica |

## Onde Colocar Cada Arquivo

- **Novo componente de feature:** `src/app/{dominio}/{feature}/`
- **Service de um único domínio:** `src/app/{dominio}/services/`
- **Service usado por 2+ domínios:** `src/app/shared/services/`
- **Interface de domínio:** `src/app/{dominio}/models/` ou `src/app/shared/models/` se compartilhada
- **Pipe de domínio:** junto com o componente que o usa
- **Pipe reutilizável:** `src/app/shared/pipes/`
- **Guard:** `src/app/shared/guards/` ou raiz se for o guard principal
- **Interceptor:** `src/app/shared/interceptors/` ou raiz

## Anti-patterns Arquiteturais

- Componente acessando `localStorage` diretamente (deve ser via `AuthService`)
- Service de domínio A importando Service de domínio B (circular dependency risco)
- God Components (>400 linhas sem justificativa)
- Lógica duplicada em dois componentes (extrair para shared)
- Rota sem `loadComponent()` (sem lazy loading)
- Providers duplicados (providedIn: 'root' é suficiente na maioria)

## Checklist Arquitetural (nova feature)

- [ ] Domínio correto identificado
- [ ] Service na pasta correta do domínio
- [ ] Rota com `loadComponent()` em `app.routes.ts`
- [ ] Guard aplicado à rota
- [ ] Interfaces em `models/`
- [ ] Sem lógica duplicada de features existentes
- [ ] Componente pai (smart) + filhos (dumb) quando necessário
- [ ] Sem acesso direto ao DOM ou localStorage no componente
