'use strict';

const express = require('express');
const router = express.Router();
const store = require('../services/deadlineStore');
const { calculate, DEADLINE_TYPES, MEANS_LABELS } = require('../services/deadlineCalculator');

// GET /api/deadlines/types
router.get('/types', (req, res) => {
  const types = Object.entries(DEADLINE_TYPES).map(([key, v]) => ({
    key,
    label: v.label,
    days: v.days,
    type: v.type,
    ref: v.ref,
  }));
  const means = Object.entries(MEANS_LABELS).map(([key, label]) => ({ key, label }));
  res.json({ types, means });
});

// GET /api/deadlines/stats
router.get('/stats', (req, res) => {
  res.json(store.getStats());
});

// POST /api/deadlines/calculate  — stateless preview (does not save)
router.post('/calculate', (req, res) => {
  try {
    res.json(calculate(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/deadlines
router.get('/', (req, res) => {
  const { status, urgency, search } = req.query;
  res.json(store.getAll({ status, urgency, search }));
});

// POST /api/deadlines  — create and persist
router.post('/', (req, res) => {
  try {
    res.status(201).json(store.create(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/deadlines/:id
router.get('/:id', (req, res) => {
  const d = store.getById(req.params.id);
  if (!d) return res.status(404).json({ error: 'Prazo não encontrado' });
  res.json(d);
});

// PATCH /api/deadlines/:id/status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['ativo', 'concluido', 'cancelado'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use: ${valid.join(', ')}` });
  }
  const d = store.updateStatus(req.params.id, status);
  if (!d) return res.status(404).json({ error: 'Prazo não encontrado' });
  res.json(d);
});

// DELETE /api/deadlines/:id
router.delete('/:id', (req, res) => {
  if (!store.remove(req.params.id)) {
    return res.status(404).json({ error: 'Prazo não encontrado' });
  }
  res.json({ ok: true });
});

module.exports = router;
