require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const urlParser = require('url');
const { url } = require('inspector');


// Midelleware para leer los datos del POST
app.use(express.urlencoded({ extended: true }));

//Nuestra base de datos en memoria
let urls = [];
let id = 1;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  try {
    // Usamos el constructor URL de JS que es más robusto
    const urlObject = new URL(originalUrl);

    // Requisito 4: Debe ser http o https
    if (urlObject.protocol !== 'http:' && urlObject.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    // DNS lookup requiere solo el hostname
    dns.lookup(urlObject.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      } else {
        const shortUrl = id++;
        urls.push({ original_url: originalUrl, short_url: shortUrl });
        return res.json({ original_url: originalUrl, short_url: shortUrl });
      }
    });
  } catch (err) {
    // Si el constructor URL falla, la URL es inválida
    return res.json({ error: 'invalid url' });
  }
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);
  const foundUrl = urls.find(u => u.short_url === shortUrl);

  if (foundUrl) {
    res.redirect(foundUrl.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });  
  }
});
