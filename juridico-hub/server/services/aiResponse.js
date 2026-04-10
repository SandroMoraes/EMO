'use strict';

/**
 * Gerador de respostas com IA.
 *
 * Usa a API da Anthropic (Claude) quando ANTHROPIC_API_KEY está definida.
 * Caso contrário, usa o gerador de templates do qualifier como fallback.
 */

let anthropic = null;

function getAnthropicClient() {
  if (anthropic) return anthropic;
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return null;
    anthropic = new Anthropic({ apiKey: key });
    return anthropic;
  } catch {
    return null;
  }
}

// ─── Prompt de sistema ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é um assistente jurídico especializado em comunicação com clientes.
Seu objetivo é gerar respostas humanizadas para WhatsApp que:
1. Demonstrem empatia com a situação do cliente
2. Transmitam confiança e competência do escritório
3. Expliquem brevemente as possibilidades jurídicas
4. Terminem com um CTA claro para agendamento de consulta gratuita
5. Usem linguagem acessível, sem jargão técnico excessivo
6. Tom: profissional, mas caloroso e acessível
7. Formato: texto para WhatsApp (máx 350 palavras, use *negrito* e emojis com moderação)

Retorne APENAS a mensagem, sem explicações adicionais.`;

// ─── Gerador com Claude API ───────────────────────────────────────────────────

async function generateWithClaude(lead) {
  const client = getAnthropicClient();
  if (!client) return null;

  const schedulingLink =
    process.env.SCHEDULING_LINK || 'https://calendly.com/seu-escritorio';

  const userPrompt = `
Gere uma resposta para WhatsApp para este lead jurídico:

- Nome: ${lead.author}
- Cidade: ${lead.city}
- Área do Direito: ${lead.area}
- Tipo de Caso: ${lead.caseType}
- Urgência: ${lead.urgency}/5
- Resumo do caso: ${lead.summary || lead.originalMessage || '(não informado)'}
- Ação sugerida: ${lead.suggestedAction}
- Link de agendamento: ${schedulingLink}

Gere uma resposta humanizada seguindo as diretrizes do sistema.`.trim();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return message.content[0]?.text?.trim() || null;
}

// ─── Fallback: template ───────────────────────────────────────────────────────

function generateFromTemplate(lead) {
  const { qualify } = require('./qualifier');
  // Reusa o buildHumanizedResponse via mensagem original ou reconstrói via dados
  const firstName = (lead.author || 'Cliente').split(' ')[0];
  const area = lead.area || 'Direito Geral';
  const caseType = lead.caseType || 'Caso Jurídico';
  const urgency = lead.urgency || 3;
  const schedulingLink =
    process.env.SCHEDULING_LINK || 'https://calendly.com/seu-escritorio';

  const opening =
    urgency >= 4
      ? `Olá, ${firstName}! Recebemos sua mensagem e entendemos a urgência.`
      : `Olá, ${firstName}! Obrigado por entrar em contato.`;

  const urgencyLine =
    urgency >= 4
      ? 'Dado o caráter *urgente* do seu caso, nossa equipe vai entrar em contato em até 1 hora.'
      : 'Nossa equipe analisou sua situação e temos boas perspectivas para te ajudar.';

  return `${opening}

Somos especialistas em *${area}* e já analisamos casos de *${caseType}* com sucesso.

${urgencyLine}

📅 *Agende sua consulta gratuita:*
${schedulingLink}

Ou responda esta mensagem com seu horário preferido. Atendemos seg–sex das 9h às 18h e sáb das 9h às 12h.

_Consulta 100% gratuita, sem compromisso._`;
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Gera resposta personalizada para um lead.
 * Usa Claude API se disponível, senão usa template.
 *
 * @param {object} lead
 * @returns {Promise<{ response: string, source: 'claude' | 'template' }>}
 */
async function generateAiResponse(lead) {
  try {
    const claudeResponse = await generateWithClaude(lead);
    if (claudeResponse) {
      return { response: claudeResponse, source: 'claude' };
    }
  } catch (err) {
    process.stderr.write(`[aiResponse] Claude API falhou: ${err.message}\n`);
  }

  return { response: generateFromTemplate(lead), source: 'template' };
}

module.exports = { generateAiResponse };
