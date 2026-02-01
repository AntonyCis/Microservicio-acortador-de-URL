require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const urlParser = require('url');

// 1. Middleware para leer datos de POST (Debe ir arriba)
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Añadido por seguridad para otros tipos de peticiones

// 2. Configuración de CORS y archivos estáticos
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

// 3. Base de datos en memoria
let urls = [];
let id = 1;

// 4. Rutas de Página Principal
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// 5. POST: Crear URL corta
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  try {
    const urlObject = new URL(originalUrl);

    // El test exige que sea http o https
    if (urlObject.protocol !== 'http:' && urlObject.protocol !== 'https:') {
      return res.json({ error: 'invalid url' });
    }

    // dns.lookup solo acepta el hostname
    dns.lookup(urlObject.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      } else {
        const shortUrl = id++;
        const newEntry = { 
          original_url: originalUrl, 
          short_url: shortUrl 
        };
        urls.push(newEntry);
        return res.json(newEntry);
      }
    });
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }
});

// 6. GET: Redirección
app.get('/api/shorturl/:short_url', (req, res) => {
  const short_url = req.params.short_url;
  
  // Buscamos convirtiendo a número para evitar errores de tipo
  const foundUrl = urls.find(u => u.short_url === parseInt(short_url));

  if (foundUrl) {
    return res.redirect(foundUrl.original_url);
  } else {
    // Si no existe, devolvemos error (opcional según el test)
    return res.json({ error: "No short URL found" });
  }
});

// 7. Listener (SIEMPRE AL FINAL)
const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});