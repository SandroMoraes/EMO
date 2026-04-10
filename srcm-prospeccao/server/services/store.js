'use strict';

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load(name) {
  ensureDir();
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch { return []; }
}

function save(name, data) {
  ensureDir();
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf8');
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

/**
 * Contato = pessoa prospectada.
 * Pode vir do juridico-hub (lead importado) ou ser criado manualmente.
 *
 * Estágios do funil:
 *   novo → contatado → reunião → proposta → convertido → perdido
 */
const FUNNEL_STAGES = ['novo', 'contatado', 'reuniao', 'proposta', 'convertido', 'perdido'];

const contacts = {
  getAll(filters = {}) {
    let data = load('contacts');
    if (filters.stage) data = data.filter((c) => c.stage === filters.stage);
    if (filters.area)  data = data.filter((c) => c.area === filters.area);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter((c) =>
        c.name?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.area?.toLowerCase().includes(q) ||
        c.caseType?.toLowerCase().includes(q)
      );
    }
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getById(id) {
    return load('contacts').find((c) => c.id === id) || null;
  },

  create(data) {
    const list = load('contacts');
    const now = new Date().toISOString();
    const contact = {
      id: uuidv4(),
      stage: 'novo',
      createdAt: now,
      updatedAt: now,
      interactions: [],   // histórico de contatos
      notes: '',
      ...data,
    };
    list.unshift(contact);
    save('contacts', list);
    return contact;
  },

  update(id, patch) {
    const list = load('contacts');
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    save('contacts', list);
    return list[idx];
  },

  addInteraction(id, interaction) {
    const list = load('contacts');
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    list[idx].interactions = list[idx].interactions || [];
    list[idx].interactions.push({
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...interaction,
    });
    list[idx].updatedAt = new Date().toISOString();
    save('contacts', list);
    return list[idx];
  },

  remove(id) {
    const list = load('contacts').filter((c) => c.id !== id);
    save('contacts', list);
  },

  getStats() {
    const data = load('contacts');
    const byStage = {};
    const byArea  = {};
    for (const c of data) {
      byStage[c.stage] = (byStage[c.stage] || 0) + 1;
      if (c.area) byArea[c.area] = (byArea[c.area] || 0) + 1;
    }
    return { total: data.length, byStage, byArea, stages: FUNNEL_STAGES };
  },
};

// ─── Campaigns ────────────────────────────────────────────────────────────────

/**
 * Campanha = sequência de mensagens enviadas a um grupo de contatos.
 * status: rascunho | ativa | pausada | concluida
 */
const campaigns = {
  getAll() {
    return load('campaigns').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getById(id) {
    return load('campaigns').find((c) => c.id === id) || null;
  },

  create(data) {
    const list = load('campaigns');
    const now  = new Date().toISOString();
    const campaign = {
      id: uuidv4(),
      status: 'rascunho',
      createdAt: now,
      updatedAt: now,
      sentCount: 0,
      openCount: 0,
      replyCount: 0,
      contactIds: [],
      steps: [],          // array de { delay, channel, templateKey, customMessage }
      ...data,
    };
    list.unshift(campaign);
    save('campaigns', list);
    return campaign;
  },

  update(id, patch) {
    const list = load('campaigns');
    const idx  = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    save('campaigns', list);
    return list[idx];
  },

  remove(id) {
    const list = load('campaigns').filter((c) => c.id !== id);
    save('campaigns', list);
  },

  getStats() {
    const data = load('campaigns');
    return {
      total: data.length,
      byStatus: data.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {}),
    };
  },
};

module.exports = { contacts, campaigns, FUNNEL_STAGES };
