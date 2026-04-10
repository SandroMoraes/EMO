'use strict';

/**
 * Qualificador de lead jurídico.
 *
 * Recebe uma mensagem de WhatsApp (texto livre), extrai:
 *   - name        : nome do remetente
 *   - city        : cidade do cliente
 *   - area        : área do direito
 *   - caseType    : tipo específico de caso
 *   - urgency     : 1 (baixa) → 5 (urgentíssimo)
 *   - keywords    : termos jurídicos detectados
 *   - summary     : resumo do caso
 *
 * E gera uma resposta humanizada com CTA para agendamento.
 */

// ─── Dicionários de classificação ─────────────────────────────────────────────

const CASE_PATTERNS = [
  {
    area: 'Direito Previdenciário',
    cases: [
      { caseType: 'Negativa de Aposentadoria pelo INSS', patterns: [/inss.*neg|neg.*aposentadoria|aposentadoria.*negad|invalidez.*inss|inss.*invalidez/i] },
      { caseType: 'Benefício Previdenciário', patterns: [/auxílio.?doença|benefício.*inss|bpc|loas|pensão.*morte.*inss/i] },
      { caseType: 'Revisão de Benefício', patterns: [/revis[aã]o.*benefício|revis[aã]o.*aposentadoria|teto.*inss/i] },
    ],
  },
  {
    area: 'Direito do Consumidor / Bancário',
    cases: [
      { caseType: 'Cobrança Indevida Bancária', patterns: [/banco.*cobr|cobr.*indevid|tarifa.*indevid|taxa.*indevid|juros.*abusiv|iof.*indevid/i] },
      { caseType: 'Superendividamento', patterns: [/dívida.*banco|banco.*dívida|negativad|spc|serasa|nome.*sujo/i] },
      { caseType: 'Fraude Bancária', patterns: [/fraude.*banco|golpe.*pix|pix.*fraude|clonaram.*cartão|cartão.*clonado/i] },
    ],
  },
  {
    area: 'Direito do Consumidor / Saúde',
    cases: [
      { caseType: 'Negativa de Cobertura Médica', patterns: [/plano.*neg|neg.*plano|plano.*saúde.*neg|cirurgi.*neg|neg.*cirurgi|cobertura.*neg/i] },
      { caseType: 'Reembolso de Plano de Saúde', patterns: [/reembolso.*plano|plano.*reembolso/i] },
      { caseType: 'Cancelamento Abusivo de Plano', patterns: [/cancelou.*plano|plano.*cancel/i] },
    ],
  },
  {
    area: 'Direito Trabalhista',
    cases: [
      { caseType: 'Rescisão Indevida', patterns: [/demiti.*injust|demiss[ãa]o.*indevid|mand.*embora.*sem/i] },
      { caseType: 'Verbas Rescisórias', patterns: [/fgts|rescis[ãa]o|férias.*proporcional|13.*salário.*não.*pago/i] },
      { caseType: 'Horas Extras', patterns: [/hora.*extra|hora.*extra.*não.*pag|overtime/i] },
      { caseType: 'Acidente de Trabalho', patterns: [/acidente.*trabalho|acidente.*serviço|lesão.*trabalho/i] },
    ],
  },
  {
    area: 'Direito de Família',
    cases: [
      { caseType: 'Pensão Alimentícia', patterns: [/aliment|pens[ãa]o.*filho|pens[ãa]o.*alimentícia/i] },
      { caseType: 'Divórcio', patterns: [/divórcio|separação.*judicial|dissolução.*casamento/i] },
      { caseType: 'Guarda de Filhos', patterns: [/guarda.*filho|custódia/i] },
    ],
  },
  {
    area: 'Direito do Consumidor',
    cases: [
      { caseType: 'Produto Defeituoso', patterns: [/produto.*defeito|defeito.*produto|víci.*produto/i] },
      { caseType: 'Serviço Não Prestado', patterns: [/serviço.*não.*prestado|prestação.*serviço.*problema/i] },
      { caseType: 'Dano Moral', patterns: [/dano.*moral|constrangimento|humilhação/i] },
    ],
  },
  {
    area: 'Direito Imobiliário',
    cases: [
      { caseType: 'Despejo / Desocupação', patterns: [/despejo|desocupação.*imóvel|locador.*quer.*sair/i] },
      { caseType: 'Conflito de Aluguel', patterns: [/aluguel.*problem|locaç[ãa]o.*problem|inquilino/i] },
      { caseType: 'Usucapião', patterns: [/usucapi[ãa]o|posse.*terra|posse.*imóvel/i] },
    ],
  },
];

// ─── Urgência ─────────────────────────────────────────────────────────────────

const URGENCY_RULES = [
  { score: 5, patterns: [/urgente|emergência|urgentíssimo|vida.*risco|risco.*vida|morte|liminar.*urgente|prazo.*amanhã|prazo.*hoje|internado|uti\b/i] },
  { score: 4, patterns: [/preciso.*logo|rápido|importante|prazo.*semana|não.*aguento|desesperado|crítico/i] },
  { score: 3, patterns: [/preciso.*ajuda|gostaria.*conversar|quero.*saber|tenho.*dúvida|me.*prejudicou/i] },
  { score: 2, patterns: [/queria.*entender|curiosidade|pesquisando|avaliando/i] },
];

// ─── Extração de nome ─────────────────────────────────────────────────────────

function extractName(text) {
  // "me chamo X", "meu nome é X", "sou X"
  const patterns = [
    /(?:me\s+chamo|meu\s+nome\s+[eé]|sou\s+(?:o|a)?)\s+([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /^([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)+)[,\s]/m,
    /Oi[,!]?\s+(?:sou\s+)?([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /Olá[,!]?\s+(?:sou\s+)?([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1] && m[1].split(' ').length <= 4) return m[1].trim();
  }
  return 'Cliente';
}

// ─── Extração de cidade ───────────────────────────────────────────────────────

function extractCity(text) {
  const patterns = [
    /(?:moro|sou|resido|estou)\s+(?:em|em\s+)\s*([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /de\s+([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)\s*[-\/]\s*[A-Z]{2}\b/,
    /([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)\s*[-\/]\s*[A-Z]{2}\b/,
    /\bem\s+([A-ZÀ-Ú][a-zà-ú]+(?: [A-ZÀ-Ú][a-zà-ú]+)*)/i,
  ];
  const STOP = new Set(['Janeiro', 'Paulo', 'Horizonte', 'Alegre']); // evita "São" solto
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1] && !STOP.has(m[1])) return m[1].trim();
  }
  return 'Não informado';
}

// ─── Classificação de caso ────────────────────────────────────────────────────

function classifyCase(text) {
  for (const group of CASE_PATTERNS) {
    for (const entry of group.cases) {
      for (const p of entry.patterns) {
        if (p.test(text)) {
          return { area: group.area, caseType: entry.caseType };
        }
      }
    }
  }
  return { area: 'Direito Geral', caseType: 'Caso Jurídico Geral' };
}

// ─── Urgência ─────────────────────────────────────────────────────────────────

function scoreUrgency(text) {
  for (const rule of URGENCY_RULES) {
    for (const p of rule.patterns) {
      if (p.test(text)) return rule.score;
    }
  }
  return 3; // neutro por padrão
}

// ─── Keywords ─────────────────────────────────────────────────────────────────

const LEGAL_KEYWORDS = [
  'inss', 'aposentadoria', 'benefício', 'auxílio', 'banco', 'tarifa',
  'taxa', 'juros', 'plano de saúde', 'cirurgia', 'cobertura', 'demissão',
  'rescisão', 'fgts', 'aluguel', 'despejo', 'pensão', 'divórcio',
  'guarda', 'dano moral', 'fraude', 'pix', 'cartão', 'dívida',
  'negativado', 'serasa', 'spc', 'trabalhista', 'acidente',
];

function extractKeywords(text) {
  const lower = text.toLowerCase();
  return LEGAL_KEYWORDS.filter((kw) => lower.includes(kw));
}

// ─── Resposta humanizada ──────────────────────────────────────────────────────

const CTA_SCHEDULING =
  process.env.SCHEDULING_LINK || 'https://calendly.com/seu-escritorio';

function buildHumanizedResponse(name, area, caseType, urgency) {
  const firstName = name.split(' ')[0];

  const opening = urgency >= 4
    ? `Olá, ${firstName}! Recebemos sua mensagem e entendemos a urgência da sua situação.`
    : `Olá, ${firstName}! Obrigado por entrar em contato conosco.`;

  const empathy = {
    'Direito Previdenciário':
      'Sabemos como é frustrante ter um benefício negado pelo INSS, especialmente quando você tanto contribuiu ao longo dos anos.',
    'Direito do Consumidor / Bancário':
      'Cobranças indevidas por parte de bancos são infelizmente comuns, mas existe solução jurídica efetiva para reverter essa situação.',
    'Direito do Consumidor / Saúde':
      'Ter um procedimento médico negado pelo plano de saúde é uma situação gravíssima. Sua saúde é prioridade absoluta e a Justiça reconhece isso.',
    'Direito Trabalhista':
      'Seus direitos trabalhistas precisam ser respeitados. Nenhum trabalhador deve sair prejudicado sem a devida compensação.',
    'Direito de Família':
      'Questões familiares exigem sensibilidade e expertise. Estamos aqui para te apoiar em cada etapa.',
    'Direito Imobiliário':
      'Problemas com imóveis podem gerar grande instabilidade. Vamos analisar todos os seus direitos.',
    'Direito do Consumidor':
      'Como consumidor, você tem direitos garantidos pelo CDC. Vamos defendê-los.',
  }[area] || 'Sua situação merece atenção especializada, e estamos prontos para te ajudar.';

  const urgencyAction = urgency >= 4
    ? 'Dado o caráter **urgente** do seu caso, precisamos conversar o mais rápido possível.'
    : 'Após análise inicial, acreditamos que seu caso tem **boas perspectivas**.';

  const cta = `
📅 *Agende sua consulta gratuita agora:*
${CTA_SCHEDULING}

Ou responda esta mensagem informando seu melhor horário. Atendemos de segunda a sexta, das 9h às 18h, e aos sábados das 9h às 12h.

_Esta consulta é 100% gratuita e sem compromisso._`.trim();

  return `${opening}\n\n${empathy}\n\n${urgencyAction}\n\nNossos especialistas em **${area}** analisarão seu caso de **${caseType}** com toda atenção que você merece.\n\n${cta}`;
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Qualifica uma mensagem de WhatsApp.
 *
 * @param {string} message   — texto da mensagem
 * @returns {{
 *   structured: object,    — dados estruturados do lead
 *   humanizedResponse: string  — resposta para enviar ao cliente
 * }}
 */
function qualify(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Mensagem inválida');
  }

  const text = message.trim();
  const name = extractName(text);
  const city = extractCity(text);
  const { area, caseType } = classifyCase(text);
  const urgency = scoreUrgency(text);
  const keywords = extractKeywords(text);

  // Resumo automático (primeiros 200 chars da mensagem, limpos)
  const summary = text.length > 200
    ? `${text.slice(0, 197).replace(/\n/g, ' ')}...`
    : text.replace(/\n/g, ' ');

  const suggestedAction =
    urgency >= 4
      ? 'Contato prioritário — caso urgente, ligar em até 1 hora'
      : urgency === 3
      ? 'Agendar consulta em até 24h'
      : 'Enviar material informativo e agendar consulta';

  const structured = {
    source: 'whatsapp',
    author: name,
    city,
    area,
    caseType,
    urgency,
    keywords,
    summary,
    suggestedAction,
    originalMessage: text,
    title: `${caseType} — ${name} (${city})`,
  };

  const humanizedResponse = buildHumanizedResponse(name, area, caseType, urgency);

  return { structured, humanizedResponse };
}

module.exports = { qualify };
