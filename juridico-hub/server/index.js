'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');

const leadsRouter = require('./routes/leads');
const qualifyRouter = require('./routes/qualify');
const monitorRouter = require('./routes/monitor');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// Serve o build do React em produção
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
}

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api/leads', leadsRouter);
app.use('/api/qualify', qualifyRouter);
app.use('/api/monitor', monitorRouter);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// Catch-all para SPA em produção
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  process.stdout.write(`\nJurídico Hub rodando em http://localhost:${PORT}\n`);
  process.stdout.write(`  API:       http://localhost:${PORT}/api/health\n`);
  process.stdout.write(`  Dashboard: http://localhost:${PORT} (após npm run build)\n`);
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stdout.write('\n  [aviso] ANTHROPIC_API_KEY não definida — respostas IA usarão templates.\n');
    process.stdout.write('  Para ativar Claude: export ANTHROPIC_API_KEY=sk-ant-...\n');
  }
  process.stdout.write('\n');
});

module.exports = app;
