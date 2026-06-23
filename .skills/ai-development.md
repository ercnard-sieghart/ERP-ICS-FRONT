# Skill: AI Development

## Quando utilizar
Toda vez que uma IA estiver atuando neste repositório — geração de código, revisão, refatoração, testes ou documentação.

## Protocolo Obrigatório para IAs

### Antes de Escrever Qualquer Código

1. **Ler o AGENTS.md** na raiz do projeto
2. **Identificar o domínio** da feature (`admin`, `compras`, `consultas`, `financeiro`, `orcamentos`)
3. **Verificar componentes existentes** que podem ser reutilizados
4. **Verificar services existentes** que cobrem parcialmente a necessidade
5. **Verificar as rotas** em `app.routes.ts`
6. **Entender a identidade visual** via `styles.scss` e PO-UI existente

### Durante o Desenvolvimento

- Usar `ChangeDetectionStrategy.OnPush` em todo componente novo
- Usar Signals para estado local
- Usar `takeUntil(destroy$)` em observables
- Tipar explicitamente (sem `any` sem justificativa)
- Seguir nomenclatura do projeto (PT-BR para domínio, camelCase para código)
- Usar PO-UI antes de criar componente visual novo
- Usar variáveis CSS do projeto (`--primary`, `--secondary`)
- Não introduzir dependências npm sem discussão

### Ao Finalizar

Sempre reportar:
```
## Alterações realizadas
- Arquivos criados: [lista]
- Arquivos modificados: [lista]
- Arquivos removidos: [lista]

## Impacto
- [descrever o que a mudança afeta]
- [descrever possíveis efeitos colaterais]

## Débito técnico introduzido
- [se houver, descrever]

## Como testar
- [passo a passo para verificar]
```

## IA em Revisão de Código

Ao revisar um PR, verificar obrigatoriamente:

- [ ] Violações de `OnPush`
- [ ] Observables sem `takeUntil`
- [ ] `any` não justificado
- [ ] `console.log` em código de produção
- [ ] Dados sensíveis em logs
- [ ] Violações de identidade visual
- [ ] Código duplicado de features existentes
- [ ] Componentes > 400 linhas sem divisão
- [ ] `localStorage` acessado diretamente em componentes
- [ ] Imports desnecessários ou não usados
- [ ] Rotas sem `loadComponent()` (sem lazy loading)
- [ ] HTTP sem tipagem

## IA em Geração de Testes

```
Ao gerar testes, sempre:
1. Cobrir happy path
2. Cobrir cenários de erro (4xx, 5xx, rede)
3. Cobrir edge cases (lista vazia, null, undefined)
4. Nomear em PT-BR descritivo
5. Usar HttpTestingController para mocks HTTP
6. Incluir afterEach com httpMock.verify()
```

## IA em Refatoração

Antes de refatorar:
- Confirmar que a refatoração foi solicitada (não fazer por iniciativa)
- Identificar todos os arquivos afetados
- Não alterar comportamento (refatoração ≠ feature)
- Manter testes existentes passando

## IA em Documentação

- Documentação em PT-BR (idioma do projeto)
- Foco no POR QUÊ, não no QUE (o código já diz o quê)
- Atualizar AGENTS.md se o padrão do projeto mudar

## Limites do que uma IA pode fazer autonomamente

| Ação | Autônomo? |
|---|---|
| Criar componente novo dentro de um domínio | Sim |
| Criar service novo dentro de um domínio | Sim |
| Modificar `app.config.ts` | Não — requer revisão humana |
| Modificar `app.routes.ts` | Sim, com cuidado |
| Adicionar nova dependência npm | Não — requer aprovação |
| Alterar configuração de build (`angular.json`) | Não |
| Alterar variáveis de ambiente | Não |
| Deletar arquivos existentes | Não — sempre confirmar |
| Refatorar código fora do escopo | Não |

## Anti-patterns de IA

- Implementar features não solicitadas ("enquanto estou aqui, vou melhorar X")
- Introduzir novo padrão arquitetural sem justificativa
- Gerar código genérico que não segue os padrões do projeto
- Remover comentários que explicam decisões arquiteturais
- Sobrescrever estilos globais ou variáveis CSS do projeto
- Criar novos arquivos de configuração sem necessidade
- Assumir que o código está errado sem entender o contexto
