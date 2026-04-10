'use strict';

const express = require('express');
const router = express.Router();
const { contacts, FUNNEL_STAGES } = require('../services/store');
const { importFromHub } = require('../services/importer');

// GET /api/contacts
router.get('/', (req, res) => {
  const { stage, area, search } = req.query;
  res.json(contacts.getAll({ stage, area, search }));
});

// GET /api/contacts/stats
router.get('/stats', (req, res) => res.json(contacts.getStats()));

// GET /api/contacts/stages
router.get('/stages', (req, res) => res.json(FUNNEL_STAGES));

// GET /api/contacts/:id
router.get('/:id', (req, res) => {
  const c = contacts.getById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Contato não encontrado' });
  res.json(c);
});

// POST /api/contacts
router.post('/', (req, res) => {
  const { name, city, area, caseType, phone, email, urgency, summary } = req.body;
  if (!name) return res.status(400).json({ error: '"name" é obrigatório' });
  const contact = contacts.create({ name, city, area, caseType, phone, email,
    urgency: urgency || 3, summary, source: 'manual' });
  res.status(201).json(contact);
});

// PATCH /api/contacts/:id
router.patch('/:id', (req, res) => {
  const allowed = ['name','city','area','caseType','phone','email','urgency','summary','notes','stage'];
  const patch = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  if (!FUNNEL_STAGES.includes(patch.stage ?? 'novo') && patch.stage !== undefined) {
    return res.status(400).json({ error: `Stage inválido. Use: ${FUNNEL_STAGES.join(', ')}` });
  }
  const updated = contacts.update(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Contato não encontrado' });
  res.json(updated);
});

// DELETE /api/contacts/:id
router.delete('/:id', (req, res) => {
  if (!contacts.getById(req.params.id))
    return res.status(404).json({ error: 'Contato não encontrado' });
  contacts.remove(req.params.id);
  res.json({ ok: true });
});

// POST /api/contacts/:id/interactions
router.post('/:id/interactions', (req, res) => {
  const { type, message, direction = 'inbound', note } = req.body;
  if (!type) return res.status(400).json({ error: '"type" é obrigatório' });
  const updated = contacts.addInteraction(req.params.id, { type, message, direction, note });
  if (!updated) return res.status(404).json({ error: 'Contato não encontrado' });
  res.json(updated);
});

// POST /api/contacts/import-hub
router.post('/import-hub', async (req, res) => {
  const { status, area } = req.body;
  try {
    const result = await importFromHub({ status, area });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: `Não foi possível conectar ao juridico-hub: ${err.message}` });
  }
});

module.exports = router;
