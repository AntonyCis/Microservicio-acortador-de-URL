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
    const urlObject = new URL(originalUrl);

    // Verificación de protocolo (Indispensable para el test)
    if (urlObject.protocol !== 'http:' && urlObject.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    dns.lookup(urlObject.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      } else {
        const shortUrl = id++;
        const newEntry = { original_url: originalUrl, short_url: shortUrl };
        urls.push(newEntry);
        
        console.log("Guardado:", newEntry); // Verificación en consola
        return res.json(newEntry);
      }
    });
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }
});

// GET: Redirigir
app.get('/api/shorturl/:short_url', (req, res) => {
  const { short_url } = req.params;
  
  // IMPORTANTE: El test envía el ID como string, hay que buscarlo como número
  const foundUrl = urls.find(u => u.short_url === parseInt(short_url));

  if (foundUrl) {
    return res.redirect(foundUrl.original_url);
  } else {
    return res.json({ error: "No short URL found" });
  }
});
