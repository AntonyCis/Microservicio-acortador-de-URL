require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const urlparser = require('url');
const dns = require('dns');

// 1. Conexión a DB (Asegúrate que DB_URL en .env no tenga < >)
const client = new MongoClient(process.env.DB_URL);
const db = client.db('urlshortner');
const urls = db.collection('urls');

// Configuración
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// 2. POST: Crear URL corta
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  
  // Validar si el hostname existe
  const hostname = urlparser.parse(originalUrl).hostname;
  
  if (!hostname) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, async (err, address) => {
    // Si DNS falla o la URL no tiene protocolo válido
    if (!address || !/ ^https?:\/\//i.test(originalUrl)) {
      return res.json({ error: 'invalid url' });
    } else {
      try {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url: originalUrl,
          short_url: urlCount
        };

        await urls.insertOne(urlDoc);
        res.json({ original_url: originalUrl, short_url: urlCount });
      } catch (e) {
        res.json({ error: 'server error' });
      }
    }
  });
});

// 3. GET: Redirigir
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;
  
  try {
    // Buscamos convirtiendo el parámetro a número (+shortUrl)
    const urlDoc = await urls.findOne({ short_url: parseInt(shortUrl) });
    
    if (urlDoc) {
      return res.redirect(urlDoc.url);
    } else {
      return res.json({ error: "No short URL found" });
    }
  } catch (e) {
    res.json({ error: 'invalid parameter' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});