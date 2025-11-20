const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const validUrl = require('valid-url');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Arquivo de banco de dados JSON
const DB_FILE = path.join(__dirname, 'database.json');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Estrutura do banco de dados em memória
let database = {
  urls: {},
  stats: {}
};

// ======= FUNÇÕES DE PERSISTÊNCIA =======

// Carregar banco de dados
async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    database = JSON.parse(data);
    console.log('✅ Banco de dados carregado');
  } catch (error) {
    if (error.code === 'ENOENT') {
      await saveDatabase();
      console.log('✅ Banco de dados criado');
    } else {
      console.error('❌ Erro ao carregar banco:', error.message);
    }
  }
}

// Salvar banco de dados
async function saveDatabase() {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(database, null, 2));
  } catch (error) {
    console.error('❌ Erro ao salvar banco:', error.message);
  }
}

// ======= ROTAS =======

// Página inicial
app.get('/', (req, res) => {
  res.json({
    message: 'URL Shortener API',
    version: '1.0.0',
    endpoints: {
      'POST /api/shorten': 'Encurtar uma URL',
      'GET /:shortCode': 'Redirecionar para URL original',
      'GET /api/stats/:shortCode': 'Obter estatísticas de uma URL',
      'GET /api/list': 'Listar todas as URLs',
      'DELETE /api/delete/:shortCode': 'Deletar uma URL'
    },
    examples: {
      shorten: {
        method: 'POST',
        endpoint: '/api/shorten',
        body: {
          url: 'https://www.example.com/very/long/url',
          customCode: 'optional-custom-code'
        }
      }
    }
  });
});

// Encurtar URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { url, customCode } = req.body;

    // Validar URL
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    if (!validUrl.isUri(url)) {
      return res.status(400).json({ error: 'URL inválida' });
    }

    // Gerar código curto
    let shortCode;
    
    if (customCode) {
      // Verificar se código personalizado já existe
      if (database.urls[customCode]) {
        return res.status(400).json({ 
          error: 'Código personalizado já está em uso',
          suggestion: `Tente: ${customCode}-${nanoid(3)}`
        });
      }
      
      // Validar código personalizado
      if (!/^[a-zA-Z0-9_-]+$/.test(customCode)) {
        return res.status(400).json({ 
          error: 'Código personalizado deve conter apenas letras, números, _ e -'
        });
      }
      
      shortCode = customCode;
    } else {
      shortCode = nanoid(7);
    }

    // Salvar no banco
    database.urls[shortCode] = {
      original: url,
      created: new Date().toISOString(),
      shortCode: shortCode
    };

    database.stats[shortCode] = {
      clicks: 0,
      lastAccess: null,
      referrers: {}
    };

    await saveDatabase();

    res.status(201).json({
      success: true,
      original: url,
      shortUrl: `${BASE_URL}/${shortCode}`,
      shortCode: shortCode,
      created: database.urls[shortCode].created
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao encurtar URL',
      message: error.message 
    });
  }
});

// Redirecionar para URL original
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Verificar se código existe
    if (!database.urls[shortCode]) {
      return res.status(404).json({ 
        error: 'URL não encontrada',
        shortCode: shortCode
      });
    }

    // Atualizar estatísticas
    database.stats[shortCode].clicks++;
    database.stats[shortCode].lastAccess = new Date().toISOString();
    
    // Registrar referrer
    const referrer = req.get('Referrer') || 'Direct';
    database.stats[shortCode].referrers[referrer] = 
      (database.stats[shortCode].referrers[referrer] || 0) + 1;

    await saveDatabase();

    // Redirecionar
    res.redirect(database.urls[shortCode].original);

  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao redirecionar',
      message: error.message 
    });
  }
});

// Obter estatísticas
app.get('/api/stats/:shortCode', (req, res) => {
  const { shortCode } = req.params;

  if (!database.urls[shortCode]) {
    return res.status(404).json({ 
      error: 'URL não encontrada' 
    });
  }

  res.json({
    shortCode: shortCode,
    original: database.urls[shortCode].original,
    shortUrl: `${BASE_URL}/${shortCode}`,
    created: database.urls[shortCode].created,
    statistics: {
      totalClicks: database.stats[shortCode].clicks,
      lastAccess: database.stats[shortCode].lastAccess,
      referrers: database.stats[shortCode].referrers,
      topReferrer: Object.entries(database.stats[shortCode].referrers)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
    }
  });
});

// Listar todas as URLs
app.get('/api/list', (req, res) => {
  const urls = Object.entries(database.urls).map(([code, data]) => ({
    shortCode: code,
    original: data.original,
    shortUrl: `${BASE_URL}/${code}`,
    created: data.created,
    clicks: database.stats[code].clicks
  }));

  // Ordenar por mais clicados
  urls.sort((a, b) => b.clicks - a.clicks);

  res.json({
    total: urls.length,
    urls: urls
  });
});

// Deletar URL
app.delete('/api/delete/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  if (!database.urls[shortCode]) {
    return res.status(404).json({ 
      error: 'URL não encontrada' 
    });
  }

  delete database.urls[shortCode];
  delete database.stats[shortCode];
  
  await saveDatabase();

  res.json({
    success: true,
    message: 'URL deletada com sucesso',
    shortCode: shortCode
  });
});

// Limpar URLs antigas (mais de 90 dias sem acesso)
app.post('/api/cleanup', async (req, res) => {
  const daysAgo = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  let deleted = 0;

  for (const [code, stats] of Object.entries(database.stats)) {
    const lastAccess = stats.lastAccess ? new Date(stats.lastAccess) : new Date(database.urls[code].created);
    
    if (lastAccess < cutoffDate) {
      delete database.urls[code];
      delete database.stats[code];
      deleted++;
    }
  }

  await saveDatabase();

  res.json({
    success: true,
    message: `${deleted} URLs antigas foram removidas`,
    cutoffDate: cutoffDate.toISOString()
  });
});

// ======= INICIALIZAÇÃO =======

async function startServer() {
  await loadDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔗 Base URL: ${BASE_URL}`);
    console.log(`📊 Total de URLs: ${Object.keys(database.urls).length}`);
  });
}

startServer();
