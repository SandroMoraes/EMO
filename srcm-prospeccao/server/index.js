'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const contactsRouter  = require('./routes/contacts');
const campaignsRouter = require('./routes/campaigns');

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

app.use('/api/contacts',  contactsRouter);
app.use('/api/campaigns', campaignsRouter);
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

if (process.env.NODE_ENV === 'production') {
  app.get('*', (_, res) =>
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  );
}

app.listen(PORT, () => {
  console.log(`\nSRCM Prospecção rodando em http://localhost:${PORT}`);
  console.log(`  API:       http://localhost:${PORT}/api/health`);
  console.log(`  Dashboard: http://localhost:${PORT}\n`);
  if (!process.env.ANTHROPIC_API_KEY)
    console.log('  [aviso] ANTHROPIC_API_KEY não definida\n');
});

module.exports = app;
