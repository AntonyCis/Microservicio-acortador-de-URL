require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const urlparser = require('url');
const dns = require('dns');

// 1. ELIMINA la línea de 'inspector'
const client = new MongoClient(process.env.DB_URL);

async function startServer() {
  await client.connect();
  const db = client.db('urlshortner');
  const urls = db.collection('urls');

  const port = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/public', express.static(`${process.cwd()}/public`));

  app.get('/', (req, res) => res.sendFile(process.cwd() + '/views/index.html'));

  // POST: Crear URL corta
  app.post('/api/shorturl', (req, res) => {
    const originalUrl = req.body.url;
    
    // Usar el constructor URL para validar protocolo (REQUISITO PARA TEST 4)
    let hostname;
    try {
      const parsedUrl = new URL(originalUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.json({ error: 'invalid url' });
      }
      hostname = parsedUrl.hostname;
    } catch (err) {
      return res.json({ error: 'invalid url' });
    }

    dns.lookup(hostname, async (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // IMPORTANTE: Asegúrate de que el short_url sea consistente
      const count = await urls.countDocuments({});
      const urlDoc = { url: originalUrl, short_url: count };

      await urls.insertOne(urlDoc);
      res.json({ original_url: originalUrl, short_url: count });
    });
  });

  // GET: Redirección
  app.get('/api/shorturl/:short_url', async (req, res) => {
    const shortUrl = req.params.short_url;
    
    // Buscar en la DB convirtiendo a número
    const urlDoc = await urls.findOne({ short_url: Number(shortUrl) });
    
    if (!urlDoc) {
      return res.json({ error: 'No short URL found for the given input' });
    } else {
      // Redirigir a la URL original guardada
      return res.redirect(urlDoc.url);
    }
  });

  app.listen(port, () => console.log(`Listening on port ${port}`));
}

startServer().catch(console.error);