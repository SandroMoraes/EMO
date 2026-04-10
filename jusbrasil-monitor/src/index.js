#!/usr/bin/env node
'use strict';

/**
 * jusbrasil-feed-monitor
 * ─────────────────────────────────────────────────────────────────────────────
 * Agente Node.js que monitora o feed público do JusBrasil por palavras-chave
 * jurídicas e retorna os últimos 20 resultados com:
 *   • Nome do autor
 *   • Cidade
 *   • Tipo de caso
 *
 * USO:
 *   node src/index.js              Executa e imprime tabela (TTY) ou JSON (pipe)
 *   node src/index.js --pretty     Força saída em tabela legível
 *   node src/index.js --json       Força saída JSON
 *   node src/index.js --demo       Usa dados simulados (sem internet)
 *   node src/index.js --watch 60   Repete a cada 60 segundos
 *   node src/index.js --help       Exibe esta ajuda
 */

const { runMonitor } = require('./monitor');

// ─── Formatação ───────────────────────────────────────────────────────────────

function printTable(results) {
  const W = 110;
  const LINE = '─'.repeat(W);
  const DLINE = '═'.repeat(W);
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  console.log(`\n${DLINE}`);
  console.log(`  JusBrasil Feed Monitor  |  ${now}  |  ${results.length} resultado(s)`);
  console.log(DLINE);

  if (!results.length) {
    console.log('\n  Nenhum resultado encontrado. Use --demo para dados simulados.\n');
    console.log(DLINE);
    return;
  }

  results.forEach((item, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const titleShort = item.title.length > 90
      ? `${item.title.slice(0, 87)}...`
      : item.title;

    console.log(`\n  [${num}] ${titleShort}`);
    console.log(LINE);
    console.log(`  Autor      : ${item.author}`);
    console.log(`  Cidade     : ${item.city}`);
    console.log(`  Tipo       : ${item.caseType}`);
    console.log(`  Área       : ${item.area}`);
    console.log(`  Data       : ${formatDate(item.date)}`);
    if (item.snippet) {
      const prev = item.snippet.length > 130
        ? `${item.snippet.slice(0, 127)}…`
        : item.snippet;
      console.log(`  Preview    : ${prev}`);
    }
    if (item.url) {
      console.log(`  URL        : ${item.url}`);
    }
  });

  console.log(`\n${DLINE}\n`);
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'Não informado') return 'Não informado';
  const ts = Date.parse(dateStr);
  if (isNaN(ts)) return dateStr;
  return new Date(ts).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function printJson(results) {
  console.log(JSON.stringify(results, null, 2));
}

// ─── Argumentos CLI ───────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    pretty: process.stdout.isTTY,
    json: false,
    demo: false,
    watch: false,
    intervalSec: 300,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--pretty': case '-p':
        opts.pretty = true; opts.json = false; break;
      case '--json': case '-j':
        opts.json = true; opts.pretty = false; break;
      case '--demo': case '-d':
        opts.demo = true; break;
      case '--watch': case '-w': {
        opts.watch = true;
        const next = parseInt(args[i + 1], 10);
        if (!isNaN(next)) { opts.intervalSec = next; i++; }
        break;
      }
      case '--help': case '-h':
        printHelp(); process.exit(0);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`
jusbrasil-feed-monitor — monitora o JusBrasil por keywords jurídicas

USO:
  node src/index.js [opções]

OPÇÕES:
  --pretty, -p       Saída em tabela formatada (padrão em TTY)
  --json,   -j       Saída JSON pura (padrão em pipe/redirecionamento)
  --demo,   -d       Usa dados simulados (não requer internet)
  --watch N, -w N    Repete a cada N segundos (padrão: 300)
  --help,   -h       Exibe esta ajuda

EXEMPLOS:
  node src/index.js --demo
  node src/index.js --json > resultados.json
  node src/index.js --watch 120 --pretty
  node src/index.js --demo --json | jq '.[0]'

KEYWORDS MONITORADAS:
  • "banco cobrou taxa indevida"
  • "INSS negou aposentadoria"
  • "plano de saúde negou cirurgia"
`);
}

// ─── Execução ─────────────────────────────────────────────────────────────────

async function run(opts) {
  try {
    if (!opts.demo) {
      process.stderr.write('\nIniciando monitoramento do JusBrasil...\n');
    }

    const results = await runMonitor({ demo: opts.demo });

    if (opts.json) {
      printJson(results);
    } else {
      printTable(results);
    }

    return results;
  } catch (err) {
    process.stderr.write(`\n[ERRO] ${err.message}\n`);
    if (!opts.demo) {
      process.stderr.write('Dica: use --demo para testar com dados simulados.\n');
    }
    process.exit(1);
  }
}

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.watch) {
    const interval = opts.intervalSec * 1000;
    process.stderr.write(
      `Modo watch ativo. Intervalo: ${opts.intervalSec}s. Ctrl+C para sair.\n`
    );
    await run(opts);
    setInterval(() => run(opts), interval);
  } else {
    await run(opts);
  }
}

main();
