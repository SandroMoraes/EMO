'use strict';

const express = require('express');
const router = express.Router();
const wa = require('../services/whatsappClient');

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
  res.json(wa.getStatus());
});

// GET /api/whatsapp/qr
router.get('/qr', (req, res) => {
  const qr = wa.getQRDataUrl();
  if (!qr) return res.status(404).json({ error: 'QR não disponível — inicie a conexão primeiro' });
  res.json({ qr });
});

// POST /api/whatsapp/connect
router.post('/connect', async (req, res) => {
  try {
    const result = await wa.start();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/disconnect
router.post('/disconnect', async (req, res) => {
  await wa.stop();
  res.json({ ok: true, message: 'WhatsApp desconectado' });
});

// PATCH /api/whatsapp/settings
router.patch('/settings', (req, res) => {
  const { autoReply } = req.body;
  if (typeof autoReply === 'boolean') wa.setAutoReply(autoReply);
  res.json(wa.getStatus());
});

module.exports = router;
