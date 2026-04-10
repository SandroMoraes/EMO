'use strict';

const express = require('express');
const router = express.Router();
const store = require('../services/store');
const { generateAiResponse } = require('../services/aiResponse');

const VALID_STATUSES = ['novo', 'qualificado', 'convertido'];

// GET /api/leads
router.get('/', (req, res) => {
  const { status, area, search } = req.query;
  const leads = store.getAll({ status, area, search });
  res.json(leads);
});

// GET /api/leads/stats
router.get('/stats', (req, res) => {
  res.json(store.getStats());
});

// GET /api/leads/:id
router.get('/:id', (req, res) => {
  const lead = store.getById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
  res.json(lead);
});

// PATCH /api/leads/:id/status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use: ${VALID_STATUSES.join(', ')}` });
  }
  const lead = store.updateStatus(req.params.id, status);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
  res.json(lead);
});

// POST /api/leads/:id/response  — gera resposta de IA
router.post('/:id/response', async (req, res) => {
  const lead = store.getById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

  try {
    const { response, source } = await generateAiResponse(lead);
    const updated = store.updateAiResponse(lead.id, response);
    res.json({ lead: updated, source });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
