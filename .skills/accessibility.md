# Skill: Accessibility

## Quando utilizar
Ao criar ou revisar qualquer componente visual, formulário, tabela, modal ou interação com o usuário.

## Padrão: WCAG 2.1 Nível AA

### Semântica HTML
```html
<!-- CORRETO — elementos semânticos -->
<main>
  <section aria-labelledby="titulo-prestacoes">
    <h1 id="titulo-prestacoes">Prestações de Contas</h1>
    <table>
      <caption>Lista de prestações do usuário</caption>
      <thead>...</thead>
      <tbody>...</tbody>
    </table>
  </section>
</main>

<!-- ERRADO — divs sem semântica -->
<div class="main">
  <div class="section">
    <div class="h1">Prestações de Contas</div>
  </div>
</div>
```

### Labels em Formulários
```html
<!-- PO-UI já lida com labels — usar p-label sempre -->
<po-input p-label="Nome do Participante" [formControl]="form.controls.nome">
</po-input>

<!-- HTML puro: label explícito ou aria-label -->
<label for="campo-nome">Nome</label>
<input id="campo-nome" type="text">

<!-- Ou aria-label quando label visual não for possível -->
<button aria-label="Fechar modal de confirmação">×</button>
```

### Contraste de Cor
- Texto normal: mínimo 4.5:1
- Texto grande (18px+): mínimo 3:1
- Paleta do projeto (`#1A4E79` sobre branco): ratio ~8:1 ✅

### Feedback de Estado para Leitores de Tela
```html
<!-- Loading -->
<div aria-live="polite" aria-label="Carregando dados">
  <po-loading-overlay [p-screen-lock]="isLoading()"></po-loading-overlay>
</div>

<!-- Erro -->
<div role="alert" *ngIf="hasError()">
  Erro ao carregar dados. Tente novamente.
</div>

<!-- Sucesso -->
<div aria-live="polite" *ngIf="successMessage()">
  {{ successMessage() }}
</div>
```

### Navegação por Teclado
- Todos os elementos interativos acessíveis via Tab
- Ordem de Tab lógica (segue fluxo visual)
- Modais: foco dentro do modal enquanto aberto (`cdkTrapFocus` ou PO-UI)
- ESC fecha modais

### Imagens
```html
<!-- Imagem informativa -->
<img [src]="usuario.foto" [alt]="'Foto de ' + usuario.nome">

<!-- Imagem decorativa -->
<img src="decoracao.png" alt="">
```

## Componentes PO-UI e Acessibilidade

O PO-UI já implementa acessibilidade básica. Ao usar:
- `po-button`: fornece role e keyboard handling
- `po-modal`: trap de foco automático
- `po-table`: `aria-label` via `p-literals`
- `po-input`: label vinculada automaticamente via `p-label`

## Anti-patterns de Acessibilidade

- `<div>` clicável sem `role="button"` e `tabindex="0"`
- Imagens sem `alt`
- Cores como único indicador de estado (usar ícone + cor)
- Formulários sem labels (usar sempre `p-label` no PO-UI)
- Modais sem gestão de foco
- `aria-hidden="true"` em elementos focáveis

## Checklist de Acessibilidade (por componente)

- [ ] Elementos interativos acessíveis via teclado (Tab/Enter/ESC)
- [ ] Imagens com `alt` descritivo (ou `alt=""` se decorativa)
- [ ] Formulários com labels vinculadas
- [ ] Estados de loading com `aria-live`
- [ ] Erros com `role="alert"`
- [ ] Contraste adequado (4.5:1 para texto normal)
- [ ] Modais com foco gerenciado
- [ ] Sem informação apenas por cor
