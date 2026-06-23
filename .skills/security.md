# Skill: Security

## Quando utilizar
Ao criar formulários com input do usuário, manipular tokens/credenciais, fazer chamadas HTTP, ou revisar código existente para vulnerabilidades.

## OWASP Top 10 — Angular

### XSS (Cross-Site Scripting)
Angular escapa automaticamente `{{ }}`. Riscos aparecem com:
```typescript
// PERIGO — evitar
element.innerHTML = userInput;
[innerHTML]="userInput"  // no template sem sanitização

// CORRETO — se obrigatório HTML dinâmico
import { DomSanitizer } from '@angular/platform-browser';
const safeHtml = this.sanitizer.bypassSecurityTrustHtml(trustedHtml);
// Apenas com HTML de fonte confiável (não user input)
```

### Injeção
- Nunca concatenar input do usuário em queries ou comandos
- Validar e sanitizar no componente E no backend
- Usar `HttpParams` para query strings (não concatenação)

### Tokens e Credenciais
```typescript
// CORRETO — sempre via AuthService
const token = this.authService.getToken();

// PROIBIDO em componentes/services de domínio
localStorage.getItem('authToken')

// PROIBIDO — nunca logar
console.log('token:', token);
console.log('senha:', password);
```

### Logs Seguros
```typescript
// CORRETO
console.error('[MeuService] Erro HTTP:', error.status, error.url);

// PROIBIDO
console.log('[AuthService] Token:', token);
console.log('[UserService] Dados:', JSON.stringify(usuario));
```

### Storage
| Dado | Storage | Motivo |
|---|---|---|
| Token de acesso | localStorage | Atual (aceitável com HTTPS) |
| Senha | NUNCA | Violação grave |
| Dados sensíveis (CPF, etc.) | NUNCA no browser | Risco |
| Cache de menus | localStorage c/ TTL | OK |

### Autenticação
- Timeout de inatividade: 15 minutos (já implementado)
- Logout limpa todo o localStorage de sessão
- 401 → logout automático (interceptor já implementado)
- Nunca expor detalhes do erro de autenticação ao usuário

### Formulários
```typescript
// Validar ANTES de enviar
Validators.required
Validators.maxLength(100)
Validators.pattern(/^[a-zA-Z0-9]*$/)  // whitelist, não blacklist

// Sanitizar dados do usuário antes de exibir de volta
```

### Headers de Segurança (Configurar no servidor)
```
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Anti-patterns de Segurança

- `bypassSecurityTrustHtml()` com input do usuário
- Tokens em variáveis de ambiente commitadas (usar secrets do CI)
- Mensagens de erro detalhadas expostas ao usuário ("Senha incorreta: hash mismatch")
- `eval()` ou `Function()` com dados externos
- URLs de redirect sem validação (open redirect)
- Logging de objetos de usuário completos

## Checklist de Segurança (por PR)

- [ ] Nenhum dado sensível em `console.log`
- [ ] Inputs validados com `Validators`
- [ ] Sem `innerHTML` com dados do usuário
- [ ] Token acessado apenas via `AuthService`
- [ ] Erros ao usuário sem detalhes técnicos
- [ ] Rotas protegidas por `authGuard`
- [ ] Rotas restritas com `patenteGuard`
- [ ] Sem credenciais hardcoded
