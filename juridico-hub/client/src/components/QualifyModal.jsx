import React, { useState } from 'react';
import { api } from '../api';

export default function QualifyModal({ onClose, onLeadCreated }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.qualify(message);
      setResult(data);
      if (data.lead?.id) onLeadCreated(data.lead);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const URGENCY_LABEL = ['', 'Baixa', 'Normal', 'Média', 'Alta', 'Urgente'];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 600,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ background: '#276749', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Qualificar Mensagem WhatsApp</div>
            <div style={{ fontSize: 12, opacity: .8 }}>Extrai área jurídica, urgência, cidade e gera resposta</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', padding: '4px 10px', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {!result ? (
            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Mensagem do Cliente
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={'Exemplo:\nOlá, meu nome é João Silva. Moro em Recife - PE. O INSS negou minha aposentadoria por invalidez mesmo com laudo médico. Preciso resolver isso com urgência!'}
                style={{ minHeight: 130, marginBottom: 12 }}
                autoFocus
              />
              {error && (
                <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, color: '#c53030', fontSize: 13 }}>
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !message.trim()}
                style={{ background: '#276749', color: '#fff', padding: '10px 24px', width: '100%', fontSize: 14 }}
              >
                {loading ? '⏳ Qualificando...' : '⚡ Qualificar Lead'}
              </button>
            </form>
          ) : (
            <div>
              {/* Dados estruturados */}
              <div style={{ background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, color: '#276749' }}>Lead Qualificado</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
                  {[
                    ['Nome', result.lead.author],
                    ['Cidade', result.lead.city],
                    ['Área', result.lead.area],
                    ['Tipo', result.lead.caseType],
                    ['Urgência', `${result.lead.urgency}/5 — ${URGENCY_LABEL[result.lead.urgency] || ''}`],
                    ['Ação', result.lead.suggestedAction],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: '#718096' }}>{k}: </span>
                      <strong>{v || '—'}</strong>
                    </div>
                  ))}
                </div>
                {result.lead.keywords?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ color: '#718096', fontSize: 12 }}>Keywords: </span>
                    {result.lead.keywords.map((kw) => (
                      <span key={kw} style={{ display: 'inline-block', margin: '2px 4px 0 0', padding: '1px 8px', background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: 99, fontSize: 11, color: '#234e52' }}>{kw}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Resposta humanizada */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>💬</span> Resposta para o Cliente
                </div>
                <textarea
                  value={result.humanizedResponse}
                  readOnly
                  style={{ minHeight: 180, fontSize: 13, lineHeight: 1.7, background: '#fffbeb' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => navigator.clipboard.writeText(result.humanizedResponse)}
                  style={{ flex: 1, background: '#2b6cb0', color: '#fff', padding: '9px 0' }}
                >
                  📋 Copiar Resposta
                </button>
                <button
                  onClick={() => { setResult(null); setMessage(''); }}
                  style={{ background: '#edf2f7', color: '#4a5568', padding: '9px 16px' }}
                >
                  Nova Mensagem
                </button>
                <button onClick={onClose} style={{ background: '#edf2f7', color: '#4a5568', padding: '9px 16px' }}>
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
