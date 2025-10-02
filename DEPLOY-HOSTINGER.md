# 🚀 DEPLOY HOSTINGER - ERP ICS FRONT

## ✅ Build de Produção Gerado com Sucesso!

### 📁 Arquivos para Upload (FTP)
O build está localizado em: **`dist/erp-ics-front/browser/`**

Faça upload de **TODOS** os arquivos desta pasta para o **diretório raiz** do seu site no Hostinger.

### 🔧 Configurações de Produção Aplicadas

- **URL da API**: `http://institutoclima128986.protheus.cloudtotvs.com.br:4050`
- **Environment**: Produção
- **Otimizações**: Bundle minificado e comprimido
- **Base HREF**: `/` (raiz do domínio)

### 📋 Estrutura de Arquivos para Upload:
```
/public_html/
├── index.html
├── main-XTLNHA4J.js
├── polyfills-B6TNHZQ6.js
├── styles-RCUMIMUE.css
├── chunk-*.js (todos os chunks)
├── icon.ico
├── assets/
│   ├── logo.png
│   └── powerbi.png
└── media/ (se existir)
```

### 🌐 Configuração do .htaccess (Importante!)

Crie um arquivo **`.htaccess`** no diretório raiz com o seguinte conteúdo:

```apache
RewriteEngine On

# Handle Angular routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^.*$ /index.html [L]

# CORS Headers for API calls
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Enable gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/ico "access plus 1 year"
    ExpiresByType image/icon "access plus 1 year"
    ExpiresByType text/ico "access plus 1 year"
    ExpiresByType application/ico "access plus 1 year"
</IfModule>
```

### 🔗 APIs Configuradas

O sistema está configurado para conectar diretamente com:
- **Protheus API**: `http://institutoclima128986.protheus.cloudtotvs.com.br:4050/rest/`

### 📊 Status do Bundle

- ✅ **Build**: Gerado com sucesso
- ⚠️ **Bundle Size**: 2.46 MB (ligeiramente acima do ideal de 2MB)
- ⚠️ **CSS Size**: 2.55 KB (ligeiramente acima do ideal de 2KB)
- ✅ **Otimizações**: Aplicadas
- ✅ **Environment**: Produção configurado

### 🚀 Comandos Yarn para Deploy:

```bash
# Build de produção padrão
yarn build:prod

# Build específico para Hostinger
yarn build:hostinger

# Build + ZIP automático (RECOMENDADO)
yarn deploy:hostinger

# Build com análise de bundle
yarn build:prod --stats-json
```

### 🔧 Troubleshooting

1. **Erro 404 em rotas**: Verifique se o .htaccess está configurado corretamente
2. **APIs não funcionam**: Verifique se o Protheus está acessível na URL configurada
3. **CSS não carrega**: Verifique se todos os arquivos foram enviados via FTP
4. **Página branca**: Verifique o console do navegador para erros JavaScript

### 📞 Contato

- **Aplicação**: ERP ICS - Sistema de Gestão
- **Versão**: 1.0.0
- **Environment**: Produção
- **Data do Build**: ${new Date().toLocaleString('pt-BR')}

---
**Nota**: Lembre-se de testar todas as funcionalidades após o deploy!


# 🧶 COMANDOS YARN - ERP ICS FRONT

## 🚀 Deploy para Hostinger

### ⚡ Comando Principal (RECOMENDADO):
```bash
yarn deploy:hostinger
```
**O que faz:**
- ✅ Gera build de produção otimizado
- ✅ Configura URL do Protheus automática 
- ✅ Cria ZIP pronto para upload
- ✅ Inclui .htaccess configurado
- ⏱️ Tempo: ~30-40 segundos

---

## 📋 Outros Comandos Disponíveis:

### 🔨 Build Commands:
```bash
# Desenvolvimento (com proxy local)
yarn start

# Build produção padrão
yarn build:prod  

# Build específico Hostinger
yarn build:hostinger

# Build + watch para desenvolvimento  
yarn watch
```

### 🧪 Testing:
```bash
# Executar testes
yarn test
```

### 🔧 Utilitários:
```bash
# Angular CLI direto
yarn ng <comando>

# Instalar dependências
yarn install

# Adicionar pacote
yarn add <package>
```

---

## 📁 Arquivos Gerados após `yarn deploy:hostinger`:

```
dist/erp-ics-front/
├── browser/              # ← Conteúdo para upload FTP
│   ├── index.html
│   ├── main-*.js
│   ├── styles-*.css  
│   ├── .htaccess        # ← Configurações Apache
│   └── assets/
└── erp-ics-hostinger-build.zip  # ← ZIP pronto para upload
```

---

## ⚙️ Configurações Automáticas:

### 🌐 URLs de Produção:
- **API Base**: `http://institutoclima128986.protheus.cloudtotvs.com.br:4050`  
- **REST Endpoint**: `/rest`
- **Environment**: Produção

### 🔒 Headers CORS (no .htaccess):
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

### 📦 Otimizações:
- Bundle minificado e comprimido
- Gzip habilitado
- Cache de arquivos estáticos
- Source maps desabilitados (produção)

---

## 🚀 Processo de Deploy:

1. **Executar comando:**
   ```bash
   yarn deploy:hostinger
   ```

2. **Upload via FTP:**
   - Extrair `erp-ics-hostinger-build.zip`
   - Upload para `public_html/` no Hostinger
   - Verificar se .htaccess foi enviado

3. **Testar aplicação:**
   - Acessar URL do site
   - Testar login/autenticação
   - Verificar APIs do Protheus

---

## 📊 Performance:

- **Bundle Size**: ~2.46 MB (otimizado)
- **Initial Load**: ~506 KB (gzipped)  
- **Build Time**: ~30-40 segundos
- **Lazy Loading**: Ativado para componentes

---

## ✅ Checklist Pós-Deploy:

- [ ] Upload realizado via FTP
- [ ] .htaccess presente e configurado
- [ ] Site carregando corretamente
- [ ] Menu "Gestão de Patentes" visível
- [ ] APIs conectando com Protheus
- [ ] Login funcionando
- [ ] Responsividade OK

**🎉 Pronto para produção com Yarn!**