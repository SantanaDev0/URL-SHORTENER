# 🔗 URL Shortener

Encurtador de URLs simples e eficiente com sistema de estatísticas de acessos.

## 🚀 Funcionalidades

- ✅ Encurtamento de URLs longas
- ✅ Códigos personalizados opcionais
- ✅ Sistema de estatísticas completo
- ✅ Rastreamento de referrers
- ✅ Contador de cliques
- ✅ Persistência em arquivo JSON
- ✅ API RESTful completa
- ✅ Listagem de todas as URLs
- ✅ Sistema de limpeza automática

## 📦 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Nanoid** - Gerador de IDs únicos
- **Valid-URL** - Validação de URLs
- **JSON** - Banco de dados em arquivo

## 🛠️ Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/url-shortener.git

# Entre no diretório
cd url-shortener

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie o servidor
npm start
```

## 🔧 Configuração

Edite o arquivo `.env`:

```env
PORT=3000
BASE_URL=http://localhost:3000
```

Para produção, configure o `BASE_URL` com seu domínio:
```env
BASE_URL=https://seu-dominio.com
```

## 📚 Endpoints da API

### `POST /api/shorten`
Encurta uma URL

**Body:**
```json
{
  "url": "https://www.exemplo.com/url/muito/longa",
  "customCode": "meu-codigo" // Opcional
}
```

**Resposta:**
```json
{
  "success": true,
  "original": "https://www.exemplo.com/url/muito/longa",
  "shortUrl": "http://localhost:3000/abc123",
  "shortCode": "abc123",
  "created": "2024-01-15T10:30:00.000Z"
}
```

### `GET /:shortCode`
Redireciona para a URL original

**Exemplo:** Acessar `http://localhost:3000/abc123` redireciona para a URL original

### `GET /api/stats/:shortCode`
Obtém estatísticas de uma URL

**Resposta:**
```json
{
  "shortCode": "abc123",
  "original": "https://www.exemplo.com",
  "shortUrl": "http://localhost:3000/abc123",
  "created": "2024-01-15T10:30:00.000Z",
  "statistics": {
    "totalClicks": 42,
    "lastAccess": "2024-01-16T15:45:00.000Z",
    "referrers": {
      "https://google.com": 20,
      "Direct": 22
    },
    "topReferrer": "Direct"
  }
}
```

### `GET /api/list`
Lista todas as URLs encurtadas

**Resposta:**
```json
{
  "total": 3,
  "urls": [
    {
      "shortCode": "abc123",
      "original": "https://www.exemplo.com",
      "shortUrl": "http://localhost:3000/abc123",
      "created": "2024-01-15T10:30:00.000Z",
      "clicks": 42
    },
    ...
  ]
}
```

### `DELETE /api/delete/:shortCode`
Deleta uma URL encurtada

**Resposta:**
```json
{
  "success": true,
  "message": "URL deletada com sucesso",
  "shortCode": "abc123"
}
```

### `POST /api/cleanup`
Remove URLs não acessadas há mais de 90 dias

**Resposta:**
```json
{
  "success": true,
  "message": "5 URLs antigas foram removidas",
  "cutoffDate": "2023-10-15T10:30:00.000Z"
}
```

## 🎯 Exemplos de Uso

### JavaScript (Fetch)
```javascript
// Encurtar URL
fetch('http://localhost:3000/api/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.exemplo.com/url/muito/longa',
    customCode: 'meu-link' // Opcional
  })
})
.then(res => res.json())
.then(data => console.log(data.shortUrl));

// Obter estatísticas
fetch('http://localhost:3000/api/stats/abc123')
  .then(res => res.json())
  .then(data => console.log(data));
```

### cURL
```bash
# Encurtar URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.exemplo.com/url/longa"}'

# Obter estatísticas
curl http://localhost:3000/api/stats/abc123

# Listar todas as URLs
curl http://localhost:3000/api/list

# Deletar URL
curl -X DELETE http://localhost:3000/api/delete/abc123
```

## 💾 Banco de Dados

O sistema utiliza um arquivo JSON (`database.json`) para persistir os dados:

```json
{
  "urls": {
    "abc123": {
      "original": "https://www.exemplo.com",
      "created": "2024-01-15T10:30:00.000Z",
      "shortCode": "abc123"
    }
  },
  "stats": {
    "abc123": {
      "clicks": 42,
      "lastAccess": "2024-01-16T15:45:00.000Z",
      "referrers": {
        "https://google.com": 20,
        "Direct": 22
      }
    }
  }
}
```

## 🔐 Códigos Personalizados

Você pode criar códigos personalizados ao invés de usar os gerados automaticamente:

```json
{
  "url": "https://github.com/seu-usuario",
  "customCode": "meu-github"
}
```

Isso criará: `http://localhost:3000/meu-github`

**Regras:**
- Apenas letras, números, `-` e `_`
- Não pode estar em uso
- Recomendado: 4-20 caracteres

## 📊 Estatísticas

O sistema rastreia automaticamente:

- **Total de cliques** - Quantas vezes a URL foi acessada
- **Último acesso** - Data e hora do último clique
- **Referrers** - De onde vieram os acessos
- **Top referrer** - Origem com mais acessos

## 🧹 Limpeza Automática

Use o endpoint `/api/cleanup` para remover URLs não acessadas há mais de 90 dias:

```bash
curl -X POST http://localhost:3000/api/cleanup
```

## 🚦 Status Codes

- `200` - Sucesso
- `201` - URL criada com sucesso
- `302` - Redirecionamento para URL original
- `400` - Requisição inválida
- `404` - URL não encontrada
- `500` - Erro no servidor

## 🎨 Melhorias Futuras

- [ ] Interface web para criar URLs
- [ ] Gráficos de estatísticas
- [ ] Expiração automática de URLs
- [ ] Autenticação de usuários
- [ ] QR Code para URLs
- [ ] Análise geográfica de acessos
- [ ] API de busca

## 📄 Licença

MIT

## 👨‍💻 Autor

Desenvolvido por Santana

---

⭐ Se este projeto foi útil, considere dar uma estrela!
# URL-SHORTENER
