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

app.post('/api/shorturl', (req, res)  => {
  const originalUrl = req.body.url;

  // 1. Validad el formato de la URL
  const urlObject = urlParser.parse(originalUrl);

  // DNS lookup require el hostname sin el protocolo (http:// o https://)
  if (!urlObject.hostname) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(urlObject.hostname, (err) => {
    if (err) {
      res.json({ error: 'invalid url' });
    } else {
      // 2. Guardar y responder
      const shortUrl = id++;
      urls.push({ original_url: originalUrl, short_url: shortUrl });

      res.json({ original_url: originalUrl, short_url: shortUrl });
    }
  });
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
