'use strict';

const { searchKeyword } = require('./scraper');
const { KEYWORDS, inferCaseType } = require('./keywords');
const { DEMO_RESULTS } = require('./demo-data');

const RESULTS_PER_KEYWORD = 20;
const REQUEST_DELAY_MS = 2000; // ms entre requisições

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Monitor ──────────────────────────────────────────────────────────────────

/**
 * Executa uma rodada de monitoramento para todas as keywords.
 * Retorna os últimos 20 resultados únicos, ordenados por data.
 *
 * @param {{ demo?: boolean }} opts
 * @returns {Promise<Array<object>>}
 */
async function runMonitor(opts = {}) {
  if (opts.demo) {
    process.stderr.write('[MODO DEMO] Usando dados simulados (sem acesso à internet).\n');
    return DEMO_RESULTS.slice(0, 20);
  }

  const allResults = [];

  for (let i = 0; i < KEYWORDS.length; i++) {
    const { query } = KEYWORDS[i];
    process.stderr.write(`[${i + 1}/${KEYWORDS.length}] Buscando: "${query}" ...\n`);

    try {
      const raw = await searchKeyword(query, RESULTS_PER_KEYWORD);

      const enriched = raw.map((item) => {
        const { caseType, area } = inferCaseType(
          item.sourceKeyword,
          item.title,
          item.snippet
        );
        return { ...item, caseType, area };
      });

      allResults.push(...enriched);
      process.stderr.write(`   -> ${raw.length} resultado(s)\n`);
    } catch (err) {
      process.stderr.write(`   [ERRO] "${query}": ${err.message}\n`);
    }

    if (i < KEYWORDS.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  if (!allResults.length) {
    throw new Error(
      'Nenhum resultado encontrado. ' +
      'Execute com --demo para ver dados simulados ou verifique a conectividade.'
    );
  }

  // Deduplicação por URL
  const seen = new Set();
  const unique = allResults.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Ordena por data (mais recente primeiro)
  unique.sort((a, b) => parseDate(b.date) - parseDate(a.date));

  return unique.slice(0, 20);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converte múltiplos formatos de data para timestamp Unix.
 * @param {string} dateStr
 * @returns {number}
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'Não informado') return 0;

  // ISO 8601 (inclui: "2024-05-10T14:30:00Z")
  const iso = Date.parse(dateStr);
  if (!isNaN(iso)) return iso;

  // "DD/MM/YYYY" ou "DD/MM/YY"
  const br = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (br) {
    const [, d, m, y] = br;
    const year = y.length === 2 ? `20${y}` : y;
    return Date.parse(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }

  // "há X horas/dias/semanas/meses/anos"
  const rel = dateStr.match(/há\s+(\d+)\s+(hora|dia|semana|m[eê]s|ano)/i);
  if (rel) {
    const qty = parseInt(rel[1], 10);
    const unit = rel[2].toLowerCase().replace('ê', 'e');
    const msMap = {
      hora: 3_600_000,
      dia: 86_400_000,
      semana: 604_800_000,
      mes: 2_592_000_000,
      ano: 31_536_000_000,
    };
    return Date.now() - qty * (msMap[unit] || 86_400_000);
  }

  return 0;
}

module.exports = { runMonitor };
