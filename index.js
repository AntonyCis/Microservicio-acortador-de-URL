require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');

const app = express();

// Middleware para POST
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// CORS y archivos estáticos
app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

// Base de datos en memoria
let urls = [];
let id = 1;

// Página principal
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// Crear URL corta
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  try {
    const urlObject = new URL(originalUrl);

    // Solo http o https
    if (urlObject.protocol !== 'http:' && urlObject.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    dns.lookup(urlObject.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      const shortUrl = id++;
      const entry = {
        original_url: originalUrl,
        short_url: shortUrl
      };

      urls.push(entry);
      res.json(entry);
    });

  } catch {
    res.json({ error: 'invalid url' });
  }
});

// Redirección
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = Number(req.params.short_url);
  const found = urls.find(u => u.short_url === shortUrl);

  if (found) {
    res.redirect(301, found.original_url);
  } else {
    res.json({ error: 'No short URL found' });
  }
});

// Listener
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// 🔑 OBLIGATORIO PARA FREECODECAMP
module.exports = app;
