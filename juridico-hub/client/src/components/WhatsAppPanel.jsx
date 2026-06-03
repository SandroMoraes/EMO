import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

const STATUS_INFO = {
  disconnected:  { label: 'Desconectado',     color: '#718096', bg: '#f7fafc', icon: '⚪' },
  connecting:    { label: 'Conectando...',     color: '#d69e2e', bg: '#fffff0', icon: '🟡' },
  qr_pending:    { label: 'Aguardando QR',     color: '#c05621', bg: '#fffaf0', icon: '🟠' },
  ready:         { label: 'Conectado',         color: '#276749', bg: '#f0fff4', icon: '🟢' },
  auth_failure:  { label: 'Falha de auth',     color: '#c53030', bg: '#fff5f5', icon: '🔴' },
};

export default function WhatsAppPanel({ onClose }) {
  const [status, setStatus] = useState({ status: 'disconnected', hasQR: false, autoReply: false, stats: { received: 0, qualified: 0, errors: 0 } });
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  async function loadStatus() {
    try {
      const s = await api.whatsapp.status();
      setStatus(s);
      if (s.hasQR) {
        const { qr } = await api.whatsapp.qr();
        setQrDataUrl(qr);
      } else {
        setQrDataUrl(null);
      }
    } catch {
      // ignore polling errors
    }
  }

  useEffect(() => {
    loadStatus();
    pollRef.current = setInterval(loadStatus, 3000);
    return () => clearInterval(pollRef.current);
  }, []);

  async function handleConnect() {
    setActionLoading(true);
    setError('');
    try {
      await api.whatsapp.connect();
      await loadStatus();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    setActionLoading(true);
    try {
      await api.whatsapp.disconnect();
      setQrDataUrl(null);
      await loadStatus();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleAutoReply() {
    try {
      const updated = await api.whatsapp.setAutoReply(!status.autoReply);
      setStatus(updated);
    } catch (e) {
      setError(e.message);
    }
  }

  const si = STATUS_INFO[status.status] || STATUS_INFO.disconnected;
  const isReady = status.status === 'ready';
  const isConnecting = status.status === 'connecting' || status.status === 'qr_pending';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#25D366', borderRadius: '12px 12px 0 0' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>💬 WhatsApp Automático</div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 2 }}>Mensagens qualificadas viram leads automaticamente</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', padding: '4px 10px', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status */}
          <div style={{ background: si.bg, border: `1px solid ${si.color}44`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{si.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: si.color }}>{si.label}</div>
              {isReady && (
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                  {status.stats.received} recebidas · {status.stats.qualified} leads gerados · {status.stats.errors} erros
                </div>
              )}
              {status.status === 'qr_pending' && (
                <div style={{ fontSize: 12, color: '#c05621', marginTop: 2 }}>
                  Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo
                </div>
              )}
              {status.status === 'connecting' && (
                <div style={{ fontSize: 12, color: '#d69e2e', marginTop: 2 }}>
                  Iniciando Chrome em background, aguarde...
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13, color: '#2d3748' }}>
                Escaneie o QR Code com o WhatsApp
              </div>
              <img
                src={qrDataUrl}
                alt="QR Code WhatsApp"
                style={{ width: 220, height: 220, border: '2px solid #e2e8f0', borderRadius: 10 }}
              />
              <div style={{ fontSize: 11, color: '#718096', marginTop: 8 }}>
                QR atualizado automaticamente a cada 3s
              </div>
            </div>
          )}

          {/* Auto-reply toggle */}
          {isReady && (
            <div style={{ background: '#f7fafc', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#2d3748' }}>Resposta automática</div>
                <div style={{ fontSize: 12, color: '#718096' }}>Envia a resposta humanizada ao lead imediatamente</div>
              </div>
              <button
                onClick={handleToggleAutoReply}
                style={{
                  background: status.autoReply ? '#25D366' : '#e2e8f0',
                  color: status.autoReply ? '#fff' : '#718096',
                  padding: '6px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  borderRadius: 20,
                  transition: 'all .2s',
                }}
              >
                {status.autoReply ? 'ON' : 'OFF'}
              </button>
            </div>
          )}

          {/* Info boxes */}
          <div style={{ background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7b341e' }}>
            <strong>ℹ️ Como funciona:</strong> O servidor abre o WhatsApp Web em background. Toda mensagem recebida de contato individual é qualificada automaticamente e vira um lead no hub. Grupos são ignorados.
          </div>

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: '10px 14px', color: '#c53030', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ background: '#edf2f7', color: '#4a5568', padding: '9px 18px' }}>
              Fechar
            </button>
            {!isReady && !isConnecting && (
              <button
                onClick={handleConnect}
                disabled={actionLoading}
                style={{ background: '#25D366', color: '#fff', padding: '9px 20px', fontWeight: 700 }}
              >
                {actionLoading ? '⏳ Iniciando...' : '📱 Conectar WhatsApp'}
              </button>
            )}
            {(isReady || isConnecting) && (
              <button
                onClick={handleDisconnect}
                disabled={actionLoading}
                style={{ background: '#e53e3e', color: '#fff', padding: '9px 20px', fontWeight: 600 }}
              >
                {actionLoading ? '⏳...' : '⏹ Desconectar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
