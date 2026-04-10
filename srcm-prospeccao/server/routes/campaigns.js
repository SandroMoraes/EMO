'use strict';

const express = require('express');
const router = express.Router();
const { campaigns } = require('../services/store');
const { runCampaign, createAutoCampaign } = require('../services/sequencer');
const { TEMPLATES, buildSequence } = require('../services/templates');

// GET /api/campaigns
router.get('/', (req, res) => res.json(campaigns.getAll()));

// GET /api/campaigns/stats
router.get('/stats', (req, res) => res.json(campaigns.getStats()));

// GET /api/campaigns/templates
router.get('/templates', (req, res) => {
  const { area, channel } = req.query;
  const list = area
    ? TEMPLATES.filter((t) => (!area || t.area === area) && (!channel || t.channel === channel))
    : TEMPLATES;
  res.json(list);
});

// GET /api/campaigns/:id
router.get('/:id', (req, res) => {
  const c = campaigns.getById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Campanha não encontrada' });
  res.json(c);
});

// POST /api/campaigns — criação manual
router.post('/', (req, res) => {
  const { name, area, channel, contactIds, steps } = req.body;
  if (!name) return res.status(400).json({ error: '"name" é obrigatório' });
  const campaign = campaigns.create({ name, area, channel, contactIds, steps });
  res.status(201).json(campaign);
});

// POST /api/campaigns/auto — cria campanha com steps automáticos por área
router.post('/auto', async (req, res) => {
  const { name, area, channel, contactIds } = req.body;
  if (!name || !area) return res.status(400).json({ error: '"name" e "area" são obrigatórios' });
  try {
    const campaign = await createAutoCampaign({ name, area, channel, contactIds });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/campaigns/:id
router.patch('/:id', (req, res) => {
  const allowed = ['name','status','contactIds','steps','area','channel'];
  const patch = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  const updated = campaigns.update(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Campanha não encontrada' });
  res.json(updated);
});

// DELETE /api/campaigns/:id
router.delete('/:id', (req, res) => {
  if (!campaigns.getById(req.params.id))
    return res.status(404).json({ error: 'Campanha não encontrada' });
  campaigns.remove(req.params.id);
  res.json({ ok: true });
});

// POST /api/campaigns/:id/run — executa próxima rodada da campanha
router.post('/:id/run', async (req, res) => {
  try {
    const result = await runCampaign(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/campaigns/sequence-preview — preview da sequência para uma área
router.get('/sequence-preview', (req, res) => {
  const { area, channel = 'whatsapp' } = req.query;
  if (!area) return res.status(400).json({ error: '"area" é obrigatório' });
  res.json(buildSequence(area, channel));
});

module.exports = router;
