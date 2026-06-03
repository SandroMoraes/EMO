import React, { useState } from 'react';
import { api } from '../api';

export default function FerramentaModal({ tool, onClose }) {
  const [form, setForm] = useState({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setError('');
  }

  async function handleSubmit() {
    const missing = tool.inputFields.filter((f) => f.required && !form[f.key]);
    if (missing.length) {
      setError(`Preencha os campos obrigatórios: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    setLoading(true);
    setError('');
    setResult('');
    try {
      const data = await api.ferramentas.run(tool.key, form);
      setResult(data.result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: result ? 860 : 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a365d', borderRadius: '12px 12px 0 0', flexShrink: 0 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{tool.icon} {tool.label}</div>
            <div style={{ color: '#90cdf4', fontSize: 12, marginTop: 2 }}>{tool.description}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', padding: '4px 10px', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Form */}
          <div style={{ padding: 20, width: result ? 320 : '100%', flexShrink: 0, overflowY: 'auto', borderRight: result ? '1px solid #e2e8f0' : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tool.inputFields.map((field) => (
                <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#2d3748' }}>
                    {field.label}
                    {field.required && <span style={{ color: '#e53e3e', marginLeft: 3 }}>*</span>}
                  </span>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={form[field.key] || ''}
                      onChange={(e) => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      style={{ resize: 'vertical' }}
                    />
                  ) : field.type === 'select' ? (
                    <select value={form[field.key] || ''} onChange={(e) => set(field.key, e.target.value)}>
                      <option value="">— Selecione —</option>
                      {field.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form[field.key] || ''}
                      onChange={(e) => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              ))}

              {error && (
                <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: '10px 14px', color: '#c53030', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ background: loading ? '#a0aec0' : '#2b6cb0', color: '#fff', padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer' }}
              >
                {loading ? '⏳ Gerando com IA...' : `✨ Gerar com Claude`}
              </button>

              {loading && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#718096' }}>
                  Aguardando resposta do Claude... (pode levar até 30s)
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13, color: '#2d3748' }}>Resultado</strong>
                <button
                  onClick={handleCopy}
                  style={{ background: copied ? '#276749' : '#edf2f7', color: copied ? '#fff' : '#4a5568', padding: '5px 12px', fontSize: 12 }}
                >
                  {copied ? '✓ Copiado!' : '📋 Copiar'}
                </button>
              </div>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 12.5,
                lineHeight: 1.65,
                color: '#2d3748',
                background: '#f7fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 16,
                margin: 0,
                fontFamily: 'inherit',
              }}>
                {result}
              </pre>
              <div style={{ fontSize: 11, color: '#a0aec0', textAlign: 'right' }}>
                ⚠️ Revisar com o advogado responsável antes de usar
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
