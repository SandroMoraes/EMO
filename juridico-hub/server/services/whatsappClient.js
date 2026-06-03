'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const store = require('./store');
const { qualify } = require('./qualifier');

let client = null;
let _status = 'disconnected'; // disconnected | connecting | qr_pending | ready | auth_failure
let _qrDataUrl = null;
let _autoReply = false;
let _stats = { received: 0, qualified: 0, errors: 0 };

function getStatus() {
  return {
    status: _status,
    hasQR: !!_qrDataUrl,
    autoReply: _autoReply,
    stats: { ..._stats },
  };
}

function getQRDataUrl() {
  return _qrDataUrl;
}

function setAutoReply(enabled) {
  _autoReply = !!enabled;
}

async function handleMessage(msg) {
  // Ignore groups, broadcast, own messages
  if (msg.from.endsWith('@g.us')) return;
  if (msg.from === 'status@broadcast') return;
  if (msg.fromMe) return;
  if (!msg.body || msg.body.trim().length < 10) return;

  _stats.received++;

  try {
    const { structured, humanizedResponse } = qualify(msg.body);
    const phoneNumber = msg.from.replace('@c.us', '');

    store.create({ ...structured, phoneNumber });
    _stats.qualified++;

    if (_autoReply) {
      await msg.reply(humanizedResponse);
    }
  } catch (err) {
    _stats.errors++;
    process.stdout.write(`[WhatsApp] erro ao qualificar: ${err.message}\n`);
  }
}

async function start() {
  if (client) return { ok: true, message: 'Cliente já iniciado' };

  _status = 'connecting';
  _qrDataUrl = null;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './data/wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', async (qr) => {
    _status = 'qr_pending';
    try {
      _qrDataUrl = await qrcode.toDataURL(qr);
    } catch {
      _qrDataUrl = null;
    }
    process.stdout.write('[WhatsApp] QR gerado — aguardando leitura...\n');
  });

  client.on('ready', () => {
    _status = 'ready';
    _qrDataUrl = null;
    process.stdout.write('[WhatsApp] Conectado e pronto!\n');
  });

  client.on('auth_failure', () => {
    _status = 'auth_failure';
    client = null;
    process.stdout.write('[WhatsApp] Falha de autenticação.\n');
  });

  client.on('disconnected', (reason) => {
    _status = 'disconnected';
    client = null;
    _qrDataUrl = null;
    process.stdout.write(`[WhatsApp] Desconectado: ${reason}\n`);
  });

  client.on('message', handleMessage);

  // Initialize asynchronously — do not await here so the HTTP response is immediate
  client.initialize().catch((err) => {
    _status = 'disconnected';
    client = null;
    process.stdout.write(`[WhatsApp] Falha ao inicializar: ${err.message}\n`);
  });

  return { ok: true, message: 'Iniciando conexão WhatsApp...' };
}

async function stop() {
  if (!client) return;
  await client.destroy().catch(() => {});
  client = null;
  _status = 'disconnected';
  _qrDataUrl = null;
  process.stdout.write('[WhatsApp] Cliente encerrado.\n');
}

module.exports = { start, stop, getStatus, getQRDataUrl, setAutoReply };
