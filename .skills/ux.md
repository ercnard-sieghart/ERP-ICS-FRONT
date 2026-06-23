# Skill: UX

## Quando utilizar
Ao projetar fluxos de usuário, telas novas, formulários, feedback de estado ou interações com o sistema.

## Princípios de UX do Projeto

### Feedback Imediato
Todo input do usuário deve ter resposta visual imediata:
- Botão de submit → estado `loading` + desabilitado durante requisição
- Campo com erro → mensagem de validação inline
- Ação concluída → toast de sucesso ou erro

### Estados Obrigatórios
Toda lista, tabela ou seção de conteúdo deve ter:
```html
<!-- Loading -->
<po-loading-overlay [p-screen-lock]="isLoading()"></po-loading-overlay>

<!-- Estado vazio -->
<po-empty-result *ngIf="!isLoading() && items().length === 0"
  p-title="Nenhum resultado encontrado"
  p-action-label="Limpar filtros"
  (p-action)="limparFiltros()">
</po-empty-result>

<!-- Estado de erro -->
<div *ngIf="hasError()" class="text-center p-8">
  <po-icon p-icon="po-icon-warning" class="text-red-500"></po-icon>
  <p>Não foi possível carregar os dados. Tente novamente.</p>
  <po-button p-label="Tentar novamente" (p-click)="carregar()"></po-button>
</div>
```

### Mensagens ao Usuário
- **Erro**: linguagem simples, sem jargão técnico, com ação sugerida
- **Sucesso**: confirmar o que foi feito
- **Warning**: contextual e acionável
- **Info**: relevante, não spam

```typescript
// CORRETO
this.notification.error({ message: 'Não foi possível salvar. Verifique sua conexão.' });

// ERRADO
this.notification.error({ message: 'HTTP 500: Internal Server Error - Connection timeout' });
```

### Formulários
- Validação em tempo real (após primeiro blur, não no keyup)
- Mensagens de erro específicas ("Campo obrigatório" em vez de só borda vermelha)
- Label sempre visível (não só placeholder)
- Botão submit desabilitado enquanto formulário inválido
- Confirmação antes de ações destrutivas (excluir, cancelar com dados preenchidos)

### Navegação
- Breadcrumb ou título de página sempre visível
- Botão "Voltar" em páginas de detalhe
- Feedback visual de rota ativa no menu
- Sem navegação "perdendo" dados do formulário sem confirmação

### Tempo de Resposta
- 0–100ms: resposta instantânea (sem feedback necessário)
- 100ms–1s: feedback sutil (spinner pequeno)
- 1s+: loading overlay ou skeleton
- 10s+: mensagem explicativa + opção de cancelar

## Fluxos Críticos do Projeto

### Prestação de Contas (fluxo principal do domínio Financeiro)
1. Usuário acessa `/financeiro/prestacao-contas`
2. Preenche cabeçalho (participante, centro de custo, etc.)
3. Adiciona despesas com upload de anexos
4. Confirma e submete
5. Feedback de sucesso com código gerado

Pontos de atenção UX:
- Formulário longo → salvar rascunho ou confirmar saída
- Upload de arquivo → progress indicator
- Dados de autocomplete → debounce 300ms + loading indicator

### Login / Sessão
- Timeout de 15 min → notificação antes de expirar (ideal: aviso em 13 min)
- Senha expirada → redirect claro com instrução
- Erro de credencial → mensagem sem revelar qual campo está errado

## Anti-patterns de UX

- Toast de sucesso que some antes do usuário ler (mínimo 3s)
- Formulário que apaga tudo ao apertar "Voltar" sem confirmação
- Erro genérico "Algo deu errado" sem ação
- Botão que some durante o loading (usuário perde referência)
- Validação só no submit (frustração do usuário)
- Loading infinito sem timeout ou opção de retry
- Menus sem indicação de rota ativa

## Checklist de UX (por tela)

- [ ] Estado de loading implementado
- [ ] Estado vazio implementado com ação
- [ ] Estado de erro com mensagem amigável e retry
- [ ] Feedback após ações (toast sucesso/erro)
- [ ] Formulário com validação inline
- [ ] Confirmação antes de ações destrutivas
- [ ] Responsividade testada
- [ ] Fluxo testado do início ao fim (happy path)
