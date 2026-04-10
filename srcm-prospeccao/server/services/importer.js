'use strict';

/**
 * Importa leads do juridico-hub e cria contatos no srcm-prospeccao.
 * Evita duplicatas por URL ou por (nome + cidade + área).
 */

const axios = require('axios');
const { contacts } = require('./store');

const HUB_URL = process.env.JURIDICO_HUB_URL || 'http://localhost:3001';

async function importFromHub(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();

  const { data: leads } = await axios.get(
    `${HUB_URL}/api/leads${params ? `?${params}` : ''}`,
    { timeout: 8000 }
  );

  const existing = contacts.getAll();
  const existingUrls = new Set(existing.map((c) => c.sourceUrl).filter(Boolean));
  const existingKeys = new Set(
    existing.map((c) => `${c.name}|${c.city}|${c.area}`)
  );

  let imported = 0;
  let skipped = 0;

  for (const lead of leads) {
    const url = lead.url || '';
    const key = `${lead.author}|${lead.city}|${lead.area}`;

    if ((url && existingUrls.has(url)) || existingKeys.has(key)) {
      skipped++;
      continue;
    }

    contacts.create({
      source: 'juridico-hub',
      sourceUrl: url,
      name: lead.author || 'Não informado',
      city: lead.city || 'Não informado',
      area: lead.area || 'Direito Geral',
      caseType: lead.caseType || '',
      urgency: lead.urgency || 3,
      summary: lead.summary || lead.snippet || '',
      phone: '',
      email: '',
      hubLeadId: lead.id,
    });

    existingUrls.add(url);
    existingKeys.add(key);
    imported++;
  }

  return { imported, skipped, total: leads.length };
}

module.exports = { importFromHub };
