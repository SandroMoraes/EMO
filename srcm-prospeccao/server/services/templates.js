'use strict';

/**
 * Motor de templates de prospecção por área jurídica.
 *
 * Cada template define:
 *   - key          : identificador único
 *   - area         : área jurídica alvo
 *   - channel      : 'whatsapp' | 'email' | 'sms'
 *   - step         : posição na sequência (1 = primeiro contato, 2 = follow-up, etc.)
 *   - subject      : assunto (só para email)
 *   - body         : corpo da mensagem (suporta variáveis {{name}}, {{city}}, etc.)
 *   - cta          : call-to-action embutido
 */

const SCHEDULING_LINK =
  process.env.SCHEDULING_LINK || 'https://calendly.com/seu-escritorio';

// ─── Variáveis disponíveis nos templates ──────────────────────────────────────
// {{name}}             primeiro nome do contato
// {{city}}             cidade do contato
// {{caseType}}         tipo de caso
// {{area}}             área jurídica
// {{schedulingLink}}   link de agendamento
// {{lawyerName}}       nome do advogado responsável (opcional)

const TEMPLATES = [
  // ── Previdenciário ──────────────────────────────────────────────────────────
  {
    key: 'prev_step1_whatsapp',
    area: 'Direito Previdenciário',
    channel: 'whatsapp',
    step: 1,
    body: `Olá, {{name}}! 👋

Vi que você pode ter tido problemas com o INSS. Sou advogado especializado em Direito Previdenciário e já ajudei centenas de pessoas em {{city}} a recuperar benefícios negados.

Casos como o seu têm *alta taxa de sucesso* na Justiça — muitas vezes sem nenhum custo inicial.

Posso te explicar seus direitos em 15 minutos. Gostaria de conversar?

👉 Agende gratuitamente: {{schedulingLink}}`,
  },
  {
    key: 'prev_step2_whatsapp',
    area: 'Direito Previdenciário',
    channel: 'whatsapp',
    step: 2,
    body: `Oi, {{name}}! Passando para verificar se recebeu minha mensagem anterior.

Sei que lidar com o INSS é *muito desgastante* — e você não precisa enfrentar isso sozinho.

Nosso escritório trabalha com *honorários só no êxito*: você não paga nada se não ganhar.

Quando seria um bom horário para conversar? 📅`,
  },
  {
    key: 'prev_step1_email',
    area: 'Direito Previdenciário',
    channel: 'email',
    step: 1,
    subject: 'Seu direito ao benefício do INSS — podemos ajudar',
    body: `Prezado(a) {{name}},

Identifiquei que você pode ter sofrido uma negativa indevida por parte do INSS referente a {{caseType}}.

Nosso escritório é especializado em Direito Previdenciário e possuímos amplo histórico de reversão dessas decisões na via judicial.

Alguns dados que podem ser relevantes para o seu caso:
• Cerca de 40% das negativas do INSS são revertidas judicialmente
• O processo pode ser iniciado sem custos antecipados
• Os benefícios retroativos são pagos com correção monetária

Estou à disposição para uma análise gratuita e sem compromisso.

📅 Agende aqui: {{schedulingLink}}

Atenciosamente,
Equipe Jurídica`,
  },

  // ── Bancário ────────────────────────────────────────────────────────────────
  {
    key: 'banc_step1_whatsapp',
    area: 'Direito do Consumidor / Bancário',
    channel: 'whatsapp',
    step: 1,
    body: `Olá, {{name}}!

Soube que você teve problemas com cobranças indevidas do banco. Isso é mais comum do que parece — e a maioria dos consumidores *tem direito à devolução em dobro* do valor cobrado indevidamente.

Sou especialista em Direito Bancário e posso avaliar seu caso *gratuitamente*. Em muitos casos, o banco é condenado a pagar também danos morais.

Quer saber se você tem direito? Me chama! 💬`,
  },
  {
    key: 'banc_step2_whatsapp',
    area: 'Direito do Consumidor / Bancário',
    channel: 'whatsapp',
    step: 2,
    body: `{{name}}, você sabia que cobranças indevidas de bancos prescrevem em *3 anos*?

Se você não agir logo, pode perder o direito de recuperar o que foi cobrado a mais.

Nossa análise é *100% gratuita* e o processo pode ser feito sem nenhum custo inicial.

Posso falar com você agora? Ou prefere agendar: {{schedulingLink}}`,
  },
  {
    key: 'banc_step1_email',
    area: 'Direito do Consumidor / Bancário',
    channel: 'email',
    step: 1,
    subject: 'Cobranças bancárias indevidas — você tem direito à devolução',
    body: `Prezado(a) {{name}},

Com base em informações disponíveis, identificamos que você pode ter sofrido cobranças indevidas por instituição financeira.

De acordo com o Código de Defesa do Consumidor (Art. 42, parágrafo único), o consumidor lesado tem direito à devolução em dobro do valor cobrado, além de possível indenização por danos morais.

Nossa equipe especializada em Direito Bancário oferece:
• Análise gratuita do seu caso
• Honorários apenas em caso de êxito
• Processo 100% digital — sem precisar sair de {{city}}

📅 Agende sua consulta: {{schedulingLink}}

Equipe Jurídica`,
  },

  // ── Saúde ────────────────────────────────────────────────────────────────────
  {
    key: 'saude_step1_whatsapp',
    area: 'Direito do Consumidor / Saúde',
    channel: 'whatsapp',
    step: 1,
    body: `Olá, {{name}}!

Negativa de plano de saúde é uma das situações mais urgentes que existem — e *na maioria dos casos, a Justiça garante o procedimento em horas*.

Sou advogado especialista nessa área e já obtive liminares em menos de 24h para casos parecidos com o seu em {{city}}.

Me conta o que aconteceu? A análise é gratuita e posso orientar você agora mesmo. 🏥`,
  },
  {
    key: 'saude_step2_whatsapp',
    area: 'Direito do Consumidor / Saúde',
    channel: 'whatsapp',
    step: 2,
    body: `{{name}}, uma atualização importante: a ANS (Agência Nacional de Saúde) proibiu a negativa de cobertura para procedimentos médicos necessários.

Isso significa que a negativa do seu plano *provavelmente é ilegal*.

Podemos entrar com uma ação de tutela de urgência e o juiz pode obrigar o plano a autorizar o procedimento *no mesmo dia*.

Vamos conversar? {{schedulingLink}}`,
  },
  {
    key: 'saude_step1_email',
    area: 'Direito do Consumidor / Saúde',
    channel: 'email',
    step: 1,
    subject: 'Negativa do plano de saúde — seus direitos garantidos por lei',
    body: `Prezado(a) {{name}},

A negativa de cobertura médica por plano de saúde viola o Código de Defesa do Consumidor e as resoluções da ANS. Você tem direito ao procedimento negado.

O que podemos fazer por você:
• Pedido de tutela de urgência (liminar) — resultado em 24 a 48h
• Indenização por danos morais pela negativa abusiva
• Representação perante a ANS

Atendemos clientes em {{city}} e em todo o Brasil, de forma 100% digital.

📅 Análise gratuita: {{schedulingLink}}

Atenciosamente,
Equipe Jurídica`,
  },

  // ── Trabalhista ──────────────────────────────────────────────────────────────
  {
    key: 'trab_step1_whatsapp',
    area: 'Direito Trabalhista',
    channel: 'whatsapp',
    step: 1,
    body: `Olá, {{name}}! 👋

Vi que você pode ter passado por uma situação difícil no trabalho. Verbas rescisórias não pagas, horas extras não reconhecidas e demissão sem justa causa têm prazo para acionar a Justiça.

Sou especialista em Direito Trabalhista e posso te dizer *exatamente quais verbas você tem direito* — de forma gratuita.

Me chama aqui ou acesse: {{schedulingLink}}`,
  },
  {
    key: 'trab_step2_whatsapp',
    area: 'Direito Trabalhista',
    channel: 'whatsapp',
    step: 2,
    body: `{{name}}, o prazo para entrar com ação trabalhista é de *2 anos* após o fim do contrato.

Se você foi demitido recentemente, agora é o momento certo de agir.

Nossa análise inicial é gratuita, e trabalhamos com *honorários apenas no êxito*. Você não paga nada se não ganhar.

Quando posso te ligar para conversarmos?`,
  },

  // ── Geral (fallback) ─────────────────────────────────────────────────────────
  {
    key: 'geral_step1_whatsapp',
    area: 'Direito Geral',
    channel: 'whatsapp',
    step: 1,
    body: `Olá, {{name}}! 👋

Soube que você pode precisar de orientação jurídica. Nossa equipe atende diversas áreas do direito e oferece *análise gratuita* do seu caso.

Posso te chamar ou prefere agendar um horário?
{{schedulingLink}}`,
  },
  {
    key: 'geral_step2_whatsapp',
    area: 'Direito Geral',
    channel: 'whatsapp',
    step: 2,
    body: `{{name}}, passando para saber se posso te ajudar com sua questão jurídica.

Nossa consulta inicial é sempre *gratuita e sem compromisso*.

Quando seria um bom momento para conversar? 📅`,
  },
];

// ─── Funções públicas ─────────────────────────────────────────────────────────

/**
 * Retorna todos os templates de uma área, ordenados por step.
 */
function getByArea(area, channel = null) {
  let list = TEMPLATES.filter(
    (t) => t.area === area || t.area === 'Direito Geral'
  );
  // Prefere templates da área específica; usa 'Direito Geral' só se não houver
  const specific = list.filter((t) => t.area === area);
  if (specific.length) list = specific;
  if (channel) list = list.filter((t) => t.channel === channel);
  return list.sort((a, b) => a.step - b.step);
}

/**
 * Retorna um template específico por key.
 */
function getByKey(key) {
  return TEMPLATES.find((t) => t.key === key) || null;
}

/**
 * Renderiza um template substituindo variáveis {{var}} por valores reais.
 *
 * @param {string} key   — chave do template
 * @param {object} vars  — { name, city, caseType, area, lawyerName }
 * @returns {{ subject?: string, body: string, channel: string }}
 */
function render(key, vars = {}) {
  const tpl = getByKey(key);
  if (!tpl) throw new Error(`Template "${key}" não encontrado`);

  const context = {
    name: 'Cliente',
    city: 'sua cidade',
    caseType: 'seu caso',
    area: tpl.area,
    schedulingLink: SCHEDULING_LINK,
    lawyerName: 'Nossa equipe',
    ...vars,
  };

  const replace = (str) =>
    str.replace(/\{\{(\w+)\}\}/g, (_, k) => context[k] || '');

  return {
    channel: tpl.channel,
    step: tpl.step,
    subject: tpl.subject ? replace(tpl.subject) : undefined,
    body: replace(tpl.body),
  };
}

/**
 * Retorna a sequência completa de templates para uma área + canal.
 * Útil para montar uma campanha automaticamente.
 */
function buildSequence(area, channel = 'whatsapp') {
  return getByArea(area, channel).map((t) => ({
    step: t.step,
    key: t.key,
    channel: t.channel,
    delayDays: t.step === 1 ? 0 : (t.step - 1) * 3, // D+0, D+3, D+6...
  }));
}

module.exports = { TEMPLATES, getByArea, getByKey, render, buildSequence };
