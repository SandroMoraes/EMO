'use strict';

// Meeus/Jones/Butcher algorithm for Easter Sunday
function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function shiftDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Returns Set of 'YYYY-MM-DD' strings for national holidays in a given year
function buildHolidaySet(year) {
  const easter = easterDate(year);
  const fixed = [
    new Date(year, 0, 1),    // Jan 1  — Confraternização
    new Date(year, 3, 21),   // Apr 21 — Tiradentes
    new Date(year, 4, 1),    // May 1  — Dia do Trabalho
    new Date(year, 8, 7),    // Sep 7  — Independência
    new Date(year, 9, 12),   // Oct 12 — N. Sra. Aparecida
    new Date(year, 10, 2),   // Nov 2  — Finados
    new Date(year, 10, 15),  // Nov 15 — Proclamação da República
    new Date(year, 11, 25),  // Dec 25 — Natal
  ];
  if (year >= 2024) fixed.push(new Date(year, 10, 20)); // Nov 20 — Consciência Negra (Lei 14.759/2023)
  const moveable = [
    shiftDays(easter, -48),  // Segunda de Carnaval
    shiftDays(easter, -47),  // Terça de Carnaval
    shiftDays(easter, -2),   // Sexta-feira Santa
    shiftDays(easter, 60),   // Corpus Christi
  ];
  return new Set([...fixed, ...moveable].map(toDateStr));
}

const _cache = {};
function holidays(year) {
  if (!_cache[year]) _cache[year] = buildHolidaySet(year);
  return _cache[year];
}

// CPC art. 220: prazo suspenso de 20/dez a 20/jan
function isRecessDay(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return (m === 12 && d >= 20) || (m === 1 && d <= 20);
}

function isBusinessDay(date) {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false;
  if (holidays(date.getFullYear()).has(toDateStr(date))) return false;
  if (isRecessDay(date)) return false;
  return true;
}

function nextBusinessDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  while (!isBusinessDay(d)) d.setDate(d.getDate() + 1);
  return d;
}

// Counts N business days forward, excluding startDate (CPC art. 224)
function addBusinessDays(startDate, n) {
  const d = new Date(startDate);
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (isBusinessDay(d)) count++;
  }
  return d;
}

// Calendar days; if result is non-business day, advances to next business day
function addCalendarDays(startDate, n) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + n);
  while (!isBusinessDay(d)) d.setDate(d.getDate() + 1);
  return d;
}

function businessDaysBefore(date, n) {
  const d = new Date(date);
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() - 1);
    if (isBusinessDay(d)) count++;
  }
  return d;
}

// Business days remaining from tomorrow to deadline (inclusive)
function businessDaysRemaining(deadlineDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadlineDateStr + 'T12:00:00');
  dl.setHours(0, 0, 0, 0);
  if (dl < today) return -1;
  let count = 0;
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= dl) {
    if (isBusinessDay(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

// ─── Deadline type catalog ────────────────────────────────────────────────────

const DEADLINE_TYPES = {
  contestacao:        { label: 'Contestação',                          days: 15, type: 'uteis',   ref: 'CPC art. 335' },
  apelacao:           { label: 'Apelação',                             days: 15, type: 'uteis',   ref: 'CPC art. 1.003, §5º' },
  agravo_instrumento: { label: 'Agravo de Instrumento',                days: 15, type: 'uteis',   ref: 'CPC art. 1.003, §5º' },
  embargos_decl:      { label: 'Embargos de Declaração',               days:  5, type: 'uteis',   ref: 'CPC art. 1.023' },
  resp_rext:          { label: 'REsp / RE',                            days: 15, type: 'uteis',   ref: 'CPC art. 1.003, §5º' },
  contrarrazoes:      { label: 'Contrarrazões',                        days: 15, type: 'uteis',   ref: 'CPC art. 1.003, §5º' },
  replica:            { label: 'Réplica',                              days: 15, type: 'uteis',   ref: 'CPC art. 351' },
  manifestacao:       { label: 'Manifestação genérica',                days: 15, type: 'uteis',   ref: 'CPC art. 218, §3º' },
  impugnacao_cs:      { label: 'Impugnação ao Cumpr. de Sentença',     days: 15, type: 'uteis',   ref: 'CPC art. 525' },
  embargos_exec:      { label: 'Embargos à Execução',                  days: 15, type: 'uteis',   ref: 'CPC art. 915' },
  agravo_regimental:  { label: 'Agravo Regimental / Interno',          days: 15, type: 'uteis',   ref: 'CPC art. 1.021' },
  jec_resposta:       { label: 'Resposta (JEC)',                       days: 30, type: 'corridos', ref: 'Lei 9.099/95, art. 30' },
  jec_recurso:        { label: 'Recurso (JEC)',                        days: 10, type: 'corridos', ref: 'Lei 9.099/95, art. 41' },
  trab_ro:            { label: 'Recurso Ordinário (CLT)',               days:  8, type: 'uteis',   ref: 'CLT art. 895' },
  trab_contrarrazoes: { label: 'Contrarrazões RO (CLT)',               days:  8, type: 'uteis',   ref: 'CLT art. 895' },
  trab_embargos:      { label: 'Embargos (TST)',                       days:  8, type: 'uteis',   ref: 'CLT art. 894' },
  trab_exec:          { label: 'Embargos à Execução (CLT)',             days:  5, type: 'uteis',   ref: 'CLT art. 884' },
  custom:             { label: 'Personalizado',                        days: null, type: 'uteis', ref: 'conforme decisão' },
};

const MEANS_LABELS = {
  dje:            'DJe (Diário da Justiça Eletrônico)',
  pje:            'PJe / Portal eletrônico',
  mandado:        'Mandado judicial',
  ar:             'AR (Aviso de Recebimento)',
  carga:          'Carga dos autos',
  citacaoDigital: 'Citação digital',
};

const DOUBLE_LABELS = {
  fazenda:       'Fazenda Pública (CPC art. 183)',
  defensoria:    'Defensoria Pública (CPC art. 186)',
  mp:            'Ministério Público (CPC art. 180)',
  litisconsorcio: 'litisconsórcio c/ procuradores distintos (CPC art. 229)',
};

// ─── Termo inicial by publication means (CPC art. 231) ───────────────────────
// AR / mandado / carga: start = publication date (day of receipt)
// DJe / PJe / citacaoDigital: start = next business day after publication
function getStartDate(publicationDate, means) {
  const pub = new Date(publicationDate + 'T12:00:00');
  if (means === 'ar' || means === 'mandado' || means === 'carga') return pub;
  return nextBusinessDay(pub);
}

// ─── Main calculate function ──────────────────────────────────────────────────

function calculate(params) {
  const {
    publicationDate,
    publicationMeans = 'dje',
    deadlineTypeKey,
    beneficiary = 'normal',
    customDays,
    customDayType = 'uteis',
  } = params;

  if (!publicationDate) throw new Error('Data de publicação/ciência é obrigatória');

  const typeInfo = DEADLINE_TYPES[deadlineTypeKey];
  if (!typeInfo) throw new Error('Tipo de prazo inválido');

  let days = typeInfo.days;
  let dayType = typeInfo.type;
  let legalRef = typeInfo.ref;

  if (deadlineTypeKey === 'custom') {
    const n = Number(customDays);
    if (!n || n < 1) throw new Error('Informe o número de dias para o prazo personalizado');
    days = n;
    dayType = customDayType || 'uteis';
    legalRef = 'conforme decisão judicial';
  }

  let doubled = false;
  if (DOUBLE_LABELS[beneficiary]) {
    days *= 2;
    doubled = true;
    legalRef += ` — prazo em dobro: ${DOUBLE_LABELS[beneficiary]}`;
  }

  const startDate = getStartDate(publicationDate, publicationMeans);
  const deadlineDate = dayType === 'uteis'
    ? addBusinessDays(startDate, days)
    : addCalendarDays(startDate, days);

  const daysLeft = businessDaysRemaining(toDateStr(deadlineDate));

  let urgency;
  if (daysLeft < 0)      urgency = 'vencido';
  else if (daysLeft <= 2) urgency = 'critico';
  else if (daysLeft <= 5) urgency = 'urgente';
  else                    urgency = 'normal';

  const alert3 = businessDaysBefore(deadlineDate, 3);
  const alert1 = businessDaysBefore(deadlineDate, 1);

  return {
    startDate:     toDateStr(startDate),
    deadlineDate:  toDateStr(deadlineDate),
    days,
    doubled,
    dayType,
    legalRef,
    urgency,
    daysLeft:      Math.max(daysLeft, 0),
    alert3:        toDateStr(alert3),
    alert1:        toDateStr(alert1),
    deadlineLabel: typeInfo.label,
    meansLabel:    MEANS_LABELS[publicationMeans] || publicationMeans,
  };
}

module.exports = { calculate, DEADLINE_TYPES, MEANS_LABELS, isBusinessDay, toDateStr, businessDaysRemaining };
