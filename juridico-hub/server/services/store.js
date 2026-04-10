'use strict';

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../data/leads.json');

// Garante diretório de dados
function ensureDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(leads) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function getAll(filters = {}) {
  let leads = load();
  if (filters.status) leads = leads.filter((l) => l.status === filters.status);
  if (filters.area) leads = leads.filter((l) => l.area === filters.area);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.author?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.caseType?.toLowerCase().includes(q) ||
        l.originalMessage?.toLowerCase().includes(q)
    );
  }
  return leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getById(id) {
  return load().find((l) => l.id === id) || null;
}

function create(data) {
  const leads = load();
  const now = new Date().toISOString();
  const lead = {
    id: uuidv4(),
    status: 'novo',
    createdAt: now,
    updatedAt: now,
    aiResponse: null,
    ...data,
  };
  leads.unshift(lead);
  save(leads);
  return lead;
}

function updateStatus(id, status) {
  const leads = load();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  leads[idx].status = status;
  leads[idx].updatedAt = new Date().toISOString();
  save(leads);
  return leads[idx];
}

function updateAiResponse(id, aiResponse) {
  const leads = load();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  leads[idx].aiResponse = aiResponse;
  leads[idx].status = leads[idx].status === 'novo' ? 'qualificado' : leads[idx].status;
  leads[idx].updatedAt = new Date().toISOString();
  save(leads);
  return leads[idx];
}

function getStats() {
  const leads = load();
  const byStatus = { novo: 0, qualificado: 0, convertido: 0 };
  const byArea = {};
  for (const l of leads) {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    if (l.area) byArea[l.area] = (byArea[l.area] || 0) + 1;
  }
  return { total: leads.length, byStatus, byArea };
}

module.exports = { getAll, getById, create, updateStatus, updateAiResponse, getStats };
