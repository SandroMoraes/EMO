'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const store = require('../services/store');

// Importa o monitor do módulo jusbrasil-monitor
const MONITOR_PATH = path.join(__dirname, '../../../jusbrasil-monitor/src/monitor');
const { runMonitor } = require(MONITOR_PATH);

/**
 * POST /api/monitor/run
 * Body: { demo?: boolean }
 *
 * Executa o monitor JusBrasil e ingere os resultados como leads.
 * Retorna os leads criados.
 */
router.post('/run', async (req, res) => {
  const { demo = false } = req.body;

  try {
    const results = await runMonitor({ demo });
    const created = [];

    for (const item of results) {
      // Evita duplicatas: checa se já existe lead com mesmo URL
      const existing = store.getAll({ search: item.url }).find((l) => l.url === item.url);
      if (existing) continue;

      const lead = store.create({
        source: 'jusbrasil',
        title: item.title,
        url: item.url,
        author: item.author,
        city: item.city,
        area: item.area,
        caseType: item.caseType,
        urgency: 3, // urgência padrão para leads do monitor
        keywords: [],
        summary: item.snippet,
        originalMessage: item.snippet,
        suggestedAction: 'Analisar caso e entrar em contato',
        date: item.date,
        sourceKeyword: item.sourceKeyword,
      });
      created.push(lead);
    }

    res.json({
      message: `Monitor concluído. ${created.length} novo(s) lead(s) importado(s).`,
      total: results.length,
      imported: created.length,
      leads: created,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
