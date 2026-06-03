'use strict';

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { calculate, businessDaysRemaining } = require('./deadlineCalculator');

const DB_FILE = path.join(__dirname, '../../data/deadlines.json');

function ensureDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { return []; }
}

function save(items) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function refreshUrgency(dl) {
  if (dl.status !== 'ativo') return dl;
  const daysLeft = businessDaysRemaining(dl.deadlineDate);
  let urgency;
  if (daysLeft < 0)      urgency = 'vencido';
  else if (daysLeft <= 2) urgency = 'critico';
  else if (daysLeft <= 5) urgency = 'urgente';
  else                    urgency = 'normal';
  return { ...dl, daysLeft: Math.max(daysLeft, 0), urgency };
}

function getAll(filters = {}) {
  let items = load().map(refreshUrgency);
  if (filters.status)  items = items.filter((d) => d.status === filters.status);
  if (filters.urgency) items = items.filter((d) => d.urgency === filters.urgency);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter((d) =>
      d.processNumber?.toLowerCase().includes(q) ||
      d.court?.toLowerCase().includes(q) ||
      d.intimatedParty?.toLowerCase().includes(q) ||
      d.deadlineLabel?.toLowerCase().includes(q)
    );
  }
  return items.sort((a, b) => new Date(a.deadlineDate) - new Date(b.deadlineDate));
}

function getById(id) {
  const dl = load().find((d) => d.id === id);
  return dl ? refreshUrgency(dl) : null;
}

function create(params) {
  const items = load();
  const calc = calculate(params);
  const now = new Date().toISOString();
  const deadline = {
    id: uuidv4(),
    status: 'ativo',
    createdAt: now,
    updatedAt: now,
    processNumber:   params.processNumber   || '',
    court:           params.court           || '',
    decisionType:    params.decisionType    || '',
    intimatedParty:  params.intimatedParty  || '',
    pole:            params.pole            || '',
    publicationMeans: params.publicationMeans || 'dje',
    publicationDate: params.publicationDate,
    deadlineTypeKey: params.deadlineTypeKey,
    beneficiary:     params.beneficiary     || 'normal',
    customDays:      params.customDays      || null,
    customDayType:   params.customDayType   || 'uteis',
    notes:           params.notes           || '',
    ...calc,
  };
  items.unshift(deadline);
  save(items);
  return refreshUrgency(deadline);
}

function updateStatus(id, status) {
  const items = load();
  const idx = items.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  items[idx].status = status;
  items[idx].updatedAt = new Date().toISOString();
  save(items);
  return refreshUrgency(items[idx]);
}

function remove(id) {
  const items = load();
  const idx = items.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  save(items);
  return true;
}

function getStats() {
  const items = load().map(refreshUrgency);
  const active = items.filter((d) => d.status === 'ativo');
  return {
    total:   items.length,
    ativo:   active.length,
    critico: active.filter((d) => d.urgency === 'critico').length,
    urgente: active.filter((d) => d.urgency === 'urgente').length,
    normal:  active.filter((d) => d.urgency === 'normal').length,
    vencido: active.filter((d) => d.urgency === 'vencido').length,
  };
}

module.exports = { getAll, getById, create, updateStatus, remove, getStats };
