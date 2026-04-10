'use strict';

const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const cheerio = require('cheerio');

// ─── HTTP client ──────────────────────────────────────────────────────────────

const http = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;' +
      'application/rss+xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  },
});

axiosRetry(http, {
  retries: 3,
  retryDelay: (n) => n * 2000,
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    (err.response && err.response.status >= 500),
});

// ─── Utilitários ──────────────────────────────────────────────────────────────

/**
 * Tenta extrair cidade de um bloco de texto.
 * @param {string} text
 * @returns {string}
 */
function extractCity(text) {
  if (!text) return 'Não informado';

  // "Cidade - UF" ou "Cidade/UF"
  const cityUf = text.match(
    /([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)\s*[-\/]\s*[A-Z]{2}\b/
  );
  if (cityUf) return cityUf[0].trim();

  // "em Cidade" (com maiúscula)
  const emCidade = text.match(/\bem\s+([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/);
  if (emCidade) return emCidade[1].trim();

  return 'Não informado';
}

// ─── Estratégia 1: Google News RSS ───────────────────────────────────────────
// Google indexa artigos do JusBrasil e expõe via RSS público.

const GNEWS_BASE =
  'https://news.google.com/rss/search?hl=pt-BR&gl=BR&ceid=BR:pt-419&q=';

/**
 * Busca via Google News RSS e retorna itens filtrados por domínio JusBrasil.
 * @param {string} keyword
 * @param {number} max
 * @returns {Promise<Array<object>>}
 */
async function searchViaGoogleNews(keyword, max = 20) {
  const query = encodeURIComponent(`site:jusbrasil.com.br ${keyword}`);
  const url = `${GNEWS_BASE}${query}`;

  const { data } = await http.get(url, {
    headers: { Accept: 'application/rss+xml, text/xml, */*' },
  });

  return parseRSS(data, keyword, max);
}

/**
 * Faz parse de XML RSS genérico.
 * @param {string} xml
 * @param {string} sourceKeyword
 * @param {number} max
 * @returns {Array<object>}
 */
function parseRSS(xml, sourceKeyword, max) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const results = [];

  $('item').each((_, el) => {
    if (results.length >= max) return false;

    const $el = $(el);
    const title = $el.find('title').text().replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    const link = $el.find('link').text().trim() || $el.find('guid').text().trim();
    const pubDate = $el.find('pubDate').text().trim();
    const description = $el
      .find('description')
      .text()
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .trim();
    const author = $el.find('author, dc\\:creator').text().trim();
    const source = $el.find('source').text().trim();

    const fullText = `${title} ${description}`;

    results.push({
      title: title || '(sem título)',
      url: link,
      author: author || source || 'Não informado',
      city: extractCity(description) !== 'Não informado'
        ? extractCity(description)
        : extractCity(fullText),
      date: pubDate || 'Não informado',
      snippet: description.slice(0, 250),
      sourceKeyword,
    });
  });

  return results;
}

// ─── Estratégia 2: JusBrasil HTML scraping ───────────────────────────────────

const JB_BASE = 'https://www.jusbrasil.com.br';
const JB_SEARCH = `${JB_BASE}/busca`;

/**
 * Busca diretamente no site do JusBrasil.
 * Pode ser bloqueada por WAF/Cloudflare dependendo do ambiente.
 * @param {string} keyword
 * @param {number} max
 * @returns {Promise<Array<object>>}
 */
async function searchViaJusBrasil(keyword, max = 20) {
  const { data } = await http.get(JB_SEARCH, {
    params: { q: keyword },
    maxRedirects: 5,
  });
  return parseJusBrasilHTML(data, keyword, max);
}

/**
 * Faz parse do HTML da página de busca do JusBrasil.
 * Tenta múltiplos seletores CSS para lidar com mudanças de layout.
 * @param {string} html
 * @param {string} sourceKeyword
 * @param {number} max
 * @returns {Array<object>}
 */
function parseJusBrasilHTML(html, sourceKeyword, max) {
  const $ = cheerio.load(html);
  const results = [];

  // Seletores em ordem de especificidade (mais → menos específico)
  const cardSelectors = [
    '[data-testid="search-result-item"]',
    'article.SearchResult',
    'article[class*="SearchResult"]',
    'div[class*="search-result"]',
    'li[class*="SearchResult"]',
    '.result-item',
    'article',
  ];

  let $cards = $();
  for (const sel of cardSelectors) {
    $cards = $(sel);
    if ($cards.length) break;
  }

  // Fallback: rastreia links para seções conhecidas
  if (!$cards.length) {
    const seen = new Set();
    $('a[href*="/artigos/"], a[href*="/noticias/"], a[href*="/jurisprudencia/"]').each(
      (_, el) => {
        const parent = $(el).closest('div, article, li, section').get(0);
        if (parent && !seen.has(parent)) {
          seen.add(parent);
          $cards = $cards.add(parent);
        }
      }
    );
  }

  $cards.each((_, card) => {
    if (results.length >= max) return false;

    const $card = $(card);

    const $titleLink = $card
      .find('h2 a, h3 a, [class*="title"] a, [class*="Title"] a')
      .first();
    const title =
      $titleLink.text().trim() || $card.find('h2, h3').first().text().trim();
    if (!title) return;

    const href = $titleLink.attr('href') || '';
    const url = href.startsWith('http') ? href : href ? `${JB_BASE}${href}` : '';

    // Autor
    let author = '';
    for (const sel of [
      '[class*="author"]', '[class*="Author"]',
      '[class*="user"]', '[class*="User"]',
      'a[href*="/perfil/"]', 'a[href*="/advogados/"]',
    ]) {
      const txt = $card.find(sel).first().text().trim();
      if (txt) { author = txt; break; }
    }

    // Data
    let date = '';
    for (const sel of ['time', '[datetime]', '[class*="date"]', '[class*="Date"]']) {
      const $el = $card.find(sel).first();
      date = $el.attr('datetime') || $el.text().trim();
      if (date) break;
    }

    // Snippet
    let snippet = '';
    for (const sel of [
      '[class*="snippet"]', '[class*="excerpt"]',
      '[class*="description"]', 'p',
    ]) {
      snippet = $card.find(sel).first().text().trim();
      if (snippet) break;
    }

    const city =
      extractCity(snippet) !== 'Não informado'
        ? extractCity(snippet)
        : extractCity($card.text());

    results.push({
      title,
      url,
      author: author || 'Não informado',
      city,
      date: date || 'Não informado',
      snippet: snippet.slice(0, 250),
      sourceKeyword,
    });
  });

  return results;
}

// ─── Estratégia 3: JusBrasil RSS próprio ─────────────────────────────────────

const JB_RSS = 'https://www.jusbrasil.com.br/busca/rss';

/**
 * Tenta o feed RSS próprio do JusBrasil (pode estar disponível em alguns planos/regiões).
 * @param {string} keyword
 * @param {number} max
 */
async function searchViaJusBrasilRSS(keyword, max = 20) {
  const { data } = await http.get(JB_RSS, {
    params: { q: keyword },
    headers: { Accept: 'application/rss+xml, text/xml, */*' },
  });
  return parseRSS(data, keyword, max);
}

// ─── Interface pública: busca com fallback automático ─────────────────────────

/**
 * Busca uma keyword tentando as fontes em ordem de prioridade.
 * Lança erro apenas se todas as fontes falharem.
 *
 * Ordem: JusBrasil RSS → JusBrasil HTML → Google News RSS
 *
 * @param {string} keyword
 * @param {number} max
 * @returns {Promise<Array<object>>}
 */
async function searchKeyword(keyword, max = 20) {
  const strategies = [
    { name: 'JusBrasil RSS', fn: () => searchViaJusBrasilRSS(keyword, max) },
    { name: 'JusBrasil HTML', fn: () => searchViaJusBrasil(keyword, max) },
    { name: 'Google News RSS', fn: () => searchViaGoogleNews(keyword, max) },
  ];

  const errors = [];
  for (const strategy of strategies) {
    try {
      const results = await strategy.fn();
      if (results.length) {
        process.stderr.write(`   [fonte: ${strategy.name}]\n`);
        return results;
      }
      process.stderr.write(`   [${strategy.name}] sem resultados, tentando próxima fonte...\n`);
    } catch (err) {
      errors.push(`${strategy.name}: ${err.message}`);
      process.stderr.write(`   [${strategy.name}] falhou: ${err.message}\n`);
    }
  }

  throw new Error(`Todas as fontes falharam:\n  ${errors.join('\n  ')}`);
}

module.exports = { searchKeyword, parseRSS, parseJusBrasilHTML };
