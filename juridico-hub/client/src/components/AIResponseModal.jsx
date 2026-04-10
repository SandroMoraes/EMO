import React, { useState } from 'react';
import { api } from '../api';

export default function AIResponseModal({ lead, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(lead.aiResponse || '');
  const [source, setSource] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const data = await api.leads.generateResponse(lead.id);
      setResponse(data.lead.aiResponse);
      setSource(data.source);
      onUpdated(data.lead);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: '#2b6cb0', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Resposta com IA</div>
            <div style={{ fontSize: 12, opacity: .8 }}>{lead.author} — {lead.caseType}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', padding: '4px 10px', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Lead info */}
          <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            <div><strong>Área:</strong> {lead.area}</div>
            <div><strong>Cidade:</strong> {lead.city}</div>
            {lead.summary && <div style={{ marginTop: 6, color: '#4a5568' }}>{lead.summary.slice(0, 120)}{lead.summary.length > 120 ? '…' : ''}</div>}
          </div>

          {/* Response area */}
          {response ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#718096' }}>
                  {source === 'claude' ? '✨ Gerado por Claude AI' : '📝 Gerado por template'}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleGenerate} disabled={loading} style={{ background: '#edf2f7', color: '#4a5568', padding: '5px 12px' }}>
                    {loading ? 'Gerando...' : 'Regenerar'}
                  </button>
                  <button onClick={handleCopy} style={{ background: copied ? '#276749' : '#2b6cb0', color: '#fff', padding: '5px 12px' }}>
                    {copied ? '✓ Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                style={{ minHeight: 220, fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6 }}
              />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <p style={{ color: '#4a5568', marginBottom: 16 }}>
                Gere uma resposta personalizada para enviar ao cliente via WhatsApp.
              </p>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{ background: '#2b6cb0', color: '#fff', padding: '10px 24px', fontSize: 14 }}
              >
                {loading ? '⏳ Gerando resposta...' : '✨ Gerar Resposta com IA'}
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, color: '#c53030', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
