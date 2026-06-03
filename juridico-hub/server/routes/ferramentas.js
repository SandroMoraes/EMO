'use strict';

const express = require('express');
const router = express.Router();
const { TOOLS, runTool } = require('../services/aiTools');

// GET /api/ferramentas  — list available tools
router.get('/', (req, res) => {
  const list = Object.entries(TOOLS).map(([key, t]) => ({
    key,
    label: t.label,
    icon: t.icon,
    description: t.description,
    inputFields: t.inputFields,
  }));
  res.json(list);
});

// POST /api/ferramentas/:tool  — execute a tool
router.post('/:tool', async (req, res) => {
  try {
    const result = await runTool(req.params.tool, req.body);
    res.json(result);
  } catch (err) {
    const status = err.message.includes('não encontrada') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
