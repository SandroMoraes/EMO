'use strict';

/**
 * Sequenciador de campanhas.
 *
 * Responsável por:
 *   1. Determinar qual mensagem enviar para cada contato de uma campanha
 *   2. Registrar o envio como interação no contato
 *   3. Avançar o contato no funil após envio
 *
 * Em produção, este módulo seria integrado a um provedor de WhatsApp
 * (Twilio, Z-API, Evolution API) e/ou SMTP.
 * Aqui ele simula o envio e grava o log.
 */

const { contacts, campaigns } = require('./store');
const { render } = require('./templates');

// ─── Simula envio (substituir por integração real) ────────────────────────────

async function sendWhatsApp(to, body) {
  // TODO: integrar com Z-API / Evolution API / Twilio
  process.stdout.write(`[WhatsApp → ${to}]\n${body}\n\n`);
  return { sent: true, provider: 'simulated', timestamp: new Date().toISOString() };
}

async function sendEmail(to, subject, body) {
  // TODO: integrar com Nodemailer / SendGrid / AWS SES
  process.stdout.write(`[Email → ${to}] ${subject}\n${body}\n\n`);
  return { sent: true, provider: 'simulated', timestamp: new Date().toISOString() };
}

// ─── Executa um step de campanha para um contato ──────────────────────────────

async function executeStep(campaign, contact, step) {
  if (!step?.key) throw new Error('Step inválido: falta templateKey');

  const vars = {
    name: (contact.name || contact.author || 'Cliente').split(' ')[0],
    city: contact.city || 'sua cidade',
    caseType: contact.caseType || 'seu caso',
    area: contact.area || '',
  };

  const rendered = render(step.key, vars);
  let result;

  if (rendered.channel === 'email') {
    result = await sendEmail(
      contact.email || contact.phone || '—',
      rendered.subject || '(sem assunto)',
      rendered.body
    );
  } else {
    result = await sendWhatsApp(contact.phone || contact.whatsapp || '—', rendered.body);
  }

  // Registra interação no contato
  contacts.addInteraction(contact.id, {
    type: rendered.channel,
    direction: 'outbound',
    campaignId: campaign.id,
    templateKey: step.key,
    step: step.step,
    message: rendered.body,
    subject: rendered.subject,
    result,
  });

  // Avança funil: novo → contatado após primeiro envio
  if (contact.stage === 'novo') {
    contacts.update(contact.id, { stage: 'contatado' });
  }

  return result;
}

// ─── Executa todos os contatos pendentes de uma campanha ─────────────────────

/**
 * Roda uma campanha: para cada contato, verifica qual step executar com base
 * no número de interações já realizadas nessa campanha.
 *
 * @param {string} campaignId
 * @returns {Promise<{ sent: number, skipped: number, errors: string[] }>}
 */
async function runCampaign(campaignId) {
  const campaign = campaigns.getById(campaignId);
  if (!campaign) throw new Error(`Campanha ${campaignId} não encontrada`);
  if (campaign.status !== 'ativa') throw new Error('Campanha não está ativa');
  if (!campaign.steps?.length) throw new Error('Campanha sem steps definidos');

  let sent = 0;
  let skipped = 0;
  const errors = [];

  for (const contactId of campaign.contactIds || []) {
    const contact = contacts.getById(contactId);
    if (!contact) { skipped++; continue; }

    // Conta interações já feitas nesta campanha para este contato
    const done = (contact.interactions || []).filter(
      (i) => i.campaignId === campaignId
    ).length;

    if (done >= campaign.steps.length) {
      skipped++; // sequência completa para este contato
      continue;
    }

    const step = campaign.steps[done];

    // Verifica delay: só envia se o tempo desde o último envio for suficiente
    if (done > 0) {
      const lastInteraction = [...(contact.interactions || [])]
        .filter((i) => i.campaignId === campaignId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      if (lastInteraction) {
        const elapsed = Date.now() - new Date(lastInteraction.createdAt).getTime();
        const required = (step.delayDays || 0) * 86_400_000;
        if (elapsed < required) { skipped++; continue; }
      }
    }

    try {
      await executeStep(campaign, contact, step);
      sent++;
    } catch (err) {
      errors.push(`${contact.name || contactId}: ${err.message}`);
    }
  }

  // Atualiza contadores da campanha
  campaigns.update(campaignId, {
    sentCount: (campaign.sentCount || 0) + sent,
  });

  return { sent, skipped, errors };
}

/**
 * Cria uma campanha já populada com steps automáticos baseados na área jurídica.
 */
async function createAutoCampaign({ name, area, channel = 'whatsapp', contactIds = [] }) {
  const { buildSequence } = require('./templates');
  const steps = buildSequence(area, channel);
  if (!steps.length) throw new Error(`Sem templates para área "${area}"`);

  return campaigns.create({ name, area, channel, steps, contactIds });
}

module.exports = { runCampaign, createAutoCampaign, executeStep };
