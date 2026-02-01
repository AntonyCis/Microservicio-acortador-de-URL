require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient} = require('mongodb');
const urlparser = require('url');
const dns = require('dns');
const { url } = require('inspector');

const client = new MongoClient(process.env.DB_URL);

async function startServer() {
  await client.connect();
  const db = client.db('urlshortner');
  const urls = db.collection('urls');

// Basic Configuration
  const port = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/public', express.static(`${process.cwd()}/public`));

  app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

// Your first API endpoint
  app.post('/api/shorturl', (req, res) => {
    const url = req.body.url;
    const hostname = urlparser.parse(url).hostname;

    if (!hostname) {
      return res.json({ error: 'invalid url' });
    }

    dns.lookup(hostname, async (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      const count = await urls.countDocuments({});
      const urlDoc = { url, short_url: count };

      await urls.insertOne(urlDoc);

      res.json({ original_url: url, short_url: count });
    });
  });

  app.get('/api/shorturl/:short_url', async (req, res) => {
    const shortUrl = Number(req.params.short_url);
    const urlDoc =  await urls.findOne({ short_url: shortUrl });
    if (!urlDoc) {
      return res.json({ error: 'invalid URL' });
    } else {
      res.redirect(urlDoc.url);
    }
  });


  app.listen(port, function() {
    console.log(`Listening on port ${port}`);
  });
}

startServer();