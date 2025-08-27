# ICS WEB

Solução WEB para intergração do ERP.

## Branches

- **main**: Produção
- **desenv**: Desenvolvimento
- **homolog**: Homologação

- Para cada nova funcionalidade, crie uma branch específica a partir de `desenvolvimento`.
  - Exemplo: `feat/consulta-extrato`, `fix/login-error`, `refactor/menu-component`
  - Após finalizar e revisar, faça merge para `desenvolvimento`.

## Padrões de Commits

- `feat:` Nova funcionalidade
- `docs:` Documentação
- `refactor:` Refatoração
- `fix:` Correção de bug

## Dependências do Angular

Se você encontrar o erro ao rodar `ng serve`:

```
Error: Could not find the '@angular-devkit/build-angular:dev-server' builder's node package.
```

Ou o erro de incompatibilidade de versões:

```
Error: The current version of "@angular/build" supports Angular versions ^20.0.0, but detected Angular version 19.0.7 instead.
```

Certifique-se de instalar a versão correta do builder para Angular 19:

```bash
yarn add @angular-devkit/build-angular@19 --dev
```

Isso garante compatibilidade com o Angular 19.x usado neste projeto.
- `style:` Ajuste visual/CSS
- `test:` Testes
- `chore:` Tarefas de manutenção

## Funcionalidades já implementadas

- Autenticação com tela de login PO-UI
- Menu lateral com navegação (Home, Dashboard, Consultas)
- Dashboard integrado com PowerBI
- Tela de Consultas com cards animados e responsivos
- Filtros dinâmicos usando PO-UI (Filial, Banco, Conta, Período)
- Relatório de extrato exibido em popup/modal customizado
- Layout responsivo com Tailwind CSS
- Correção de imports e bindings PO-UI
- Cards de consulta com animação e hover
- Botão Buscar integrado aos filtros
- Visual moderno e limpo, seguindo padrões PO-UI

---

Para dúvidas ou sugestões, entre em contato com o time de desenvolvimento.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
