# Skill: UI

## Quando utilizar
Ao criar ou modificar qualquer interface visual — novos componentes, páginas, modais, formulários, tabelas ou elementos de layout.

## Identidade Visual Obrigatória

### Paleta de Cores
```scss
// SEMPRE usar variáveis CSS — NUNCA hardcode
--primary: #1A4E79;     // Azul institucional
--secondary: #75C9C8;   // Teal/Ciano
--gradient: linear-gradient(135deg, #1A4E79 0%, #75C9C8 100%);
--hover-bg: rgba(117, 201, 200, 0.1);
```

### Classes Globais Existentes (styles.scss)
```scss
.btn-primary-blue   // botão azul primário
.status-tag         // badge de status
.valor-monetario    // valor em dinheiro formatado
```

## Hierarquia de Componentes

1. **PO-UI** (`@po-ui/ng-components`) — sempre primeira opção
2. **Tailwind CSS** — layout, espaçamento, responsividade
3. **Classes globais** (styles.scss) — padrões do projeto
4. **CSS do componente** — último recurso, escoped

## Componentes PO-UI — Mapeamento

```html
<!-- Botões -->
<po-button p-label="Salvar" p-type="primary"></po-button>
<po-button p-label="Cancelar" p-type="default"></po-button>

<!-- Tabela -->
<po-table [p-columns]="colunas" [p-items]="itens" [p-loading]="isLoading()">
</po-table>

<!-- Modal -->
<po-modal #modal p-title="Confirmar" (p-confirm)="onConfirm()">
</po-modal>

<!-- Notificação toast -->
<!-- Via PoNotificationService.inject() -->
this.notification.success({ message: 'Salvo com sucesso!' });
this.notification.error({ message: 'Erro ao salvar.' });

<!-- Campo de formulário -->
<po-input p-label="Nome" [formControl]="form.controls.nome"></po-input>
<po-select p-label="Status" [p-options]="opcoes" [formControl]="form.controls.status">
</po-select>
<po-combo p-label="Participante" [p-filter-service]="filterService">
</po-combo>

<!-- Loading -->
<po-loading-overlay [p-screen-lock]="isLoading()"></po-loading-overlay>

<!-- Ícone -->
<po-icon p-icon="po-icon-filter"></po-icon>
```

## Responsividade

- Breakpoint principal do menu: **680px**
- Usar classes Tailwind para responsividade:
```html
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2">...</div>
</div>
```
- Testar em mobile (375px) e desktop (1280px)

## Regras

- **NUNCA** sobrescrever estilos do PO-UI globalmente
- **SEMPRE** verificar se existe componente PO-UI para o caso antes de criar
- **NUNCA** usar cores ou fontes fora do design system
- **SEMPRE** incluir estado de loading nas operações assíncronas
- **SEMPRE** incluir estado vazio ("Nenhum resultado encontrado")
- **SEMPRE** incluir estado de erro com mensagem amigável (não técnica)

## Padrões de Layout de Página

```html
<!-- Estrutura padrão de página -->
<div class="p-4 md:p-6">
  <!-- Cabeçalho da página -->
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold" style="color: var(--primary)">
      Título da Página
    </h1>
    <po-button p-label="Ação Principal" p-type="primary"></po-button>
  </div>

  <!-- Filtros (quando houver) -->
  <div class="bg-white rounded-lg shadow p-4 mb-4">
    <!-- filtros -->
  </div>

  <!-- Conteúdo principal -->
  <div class="bg-white rounded-lg shadow">
    <po-table ...></po-table>
  </div>
</div>
```

## Anti-patterns de UI

- Criar novo botão customizado quando `po-button` atende
- Usar `alert()` ou `confirm()` do browser (usar `po-modal`)
- Usar `window.alert()` para notificações (usar `PoNotificationService`)
- Estilos inline com cores hardcoded (`style="color: #1A4E79"` → usar variável CSS)
- Tabelas com HTML puro quando `po-table` resolve
- Formulários sem estados visuais (loading, erro, sucesso)

## Checklist de UI (por componente)

- [ ] Usa componentes PO-UI quando disponível
- [ ] Cores via variáveis CSS (não hardcode)
- [ ] Estado de loading implementado
- [ ] Estado vazio implementado
- [ ] Estado de erro implementado com mensagem amigável
- [ ] Responsivo (mobile + desktop)
- [ ] Testado visualmente no browser
- [ ] Sem sobrescrita global de estilos PO-UI
