'use strict';

const express = require('express');
const router = express.Router();
const { qualify } = require('../services/qualifier');
const store = require('../services/store');

/**
 * POST /api/qualify
 * Body: { message: string, save?: boolean }
 *
 * Qualifica mensagem WhatsApp e opcionalmente salva como lead.
 */
router.post('/', (req, res) => {
  const { message, save = true } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Campo "message" é obrigatório' });
  }

  try {
    const { structured, humanizedResponse } = qualify(message);

    let lead = null;
    if (save) {
      lead = store.create(structured);
    }

    res.json({
      lead: lead || structured,
      humanizedResponse,
      saved: !!lead,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
