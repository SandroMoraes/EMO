import React, { useState, useEffect } from 'react';
import { api } from '../api';

const URGENCY_COLOR = {
  critico:     { bg: '#fff5f5', border: '#feb2b2', text: '#c53030', badge: '#e53e3e' },
  urgente:     { bg: '#fffaf0', border: '#fbd38d', text: '#c05621', badge: '#dd6b20' },
  normal:      { bg: '#f0fff4', border: '#9ae6b4', text: '#276749', badge: '#38a169' },
  vencido:     { bg: '#1a202c', border: '#4a5568', text: '#e2e8f0', badge: '#718096' },
  informativo: { bg: '#ebf8ff', border: '#90cdf4', text: '#2b6cb0', badge: '#3182ce' },
};

const URGENCY_LABEL = {
  critico: '🔴 CRÍTICO — ≤ 2 dias úteis',
  urgente: '🟠 URGENTE — 3 a 5 dias úteis',
  normal:  '🟢 NORMAL — mais de 5 dias úteis',
  vencido: '⚫ VENCIDO',
};

const BENEFICIARY_OPTIONS = [
  { value: 'normal',        label: 'Parte comum' },
  { value: 'fazenda',       label: 'Fazenda Pública (dobro)' },
  { value: 'defensoria',    label: 'Defensoria Pública (dobro)' },
  { value: 'mp',            label: 'Ministério Público (dobro)' },
  { value: 'litisconsorcio',label: 'Litisconsórcio c/ proc. distintos (dobro)' },
];

const DECISION_TYPES = [
  'Sentença', 'Decisão interlocutória', 'Despacho', 'Ato ordinatório',
  'Acórdão', 'Embargos de declaração', 'Decisão monocrática',
];

function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

export default function DeadlineCalculatorModal({ onClose, onSaved }) {
  const [types, setTypes] = useState([]);
  const [means, setMeans] = useState([]);
  const [form, setForm] = useState({
    publicationDate: '',
    publicationMeans: 'dje',
    deadlineTypeKey: 'contestacao',
    beneficiary: 'normal',
    customDays: '',
    customDayType: 'uteis',
    processNumber: '',
    court: '',
    decisionType: 'Decisão interlocutória',
    intimatedParty: '',
    pole: 'passivo',
    notes: '',
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.deadlines.types().then(({ types: t, means: m }) => {
      setTypes(t);
      setMeans(m);
    }).catch(() => {});
  }, []);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
    setPreview(null);
    setError('');
  }

  async function handleCalculate() {
    setLoading(true);
    setError('');
    try {
      const result = await api.deadlines.calculate(form);
      setPreview(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const saved = await api.deadlines.create(form);
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isCustom = form.deadlineTypeKey === 'custom';
  const uc = preview ? (URGENCY_COLOR[preview.urgency] || URGENCY_COLOR.normal) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a365d', borderRadius: '12px 12px 0 0' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>⏱️ Calcular Prazo Processual</div>
            <div style={{ color: '#90cdf4', fontSize: 12, marginTop: 2 }}>Confira sempre em fonte oficial e calendário forense local</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', padding: '4px 10px', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Identificação do ato */}
          <section>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Identificação do ato</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                Nº do processo
                <input value={form.processNumber} onChange={(e) => set('processNumber', e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                Vara / Tribunal
                <input value={form.court} onChange={(e) => set('court', e.target.value)} placeholder="Ex.: 3ª Vara Cível — TJSP" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                Tipo de decisão
                <select value={form.decisionType} onChange={(e) => set('decisionType', e.target.value)}>
                  {DECISION_TYPES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                Polo da parte intimada
                <select value={form.pole} onChange={(e) => set('pole', e.target.value)}>
                  <option value="ativo">Ativo (autor)</option>
                  <option value="passivo">Passivo (réu)</option>
                  <option value="terceiro">Terceiro / assistente</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, gridColumn: '1/-1' }}>
                Parte intimada
                <input value={form.intimatedParty} onChange={(e) => set('intimatedParty', e.target.value)} placeholder="Ex.: INSS, João da Silva" />
              </label>
            </div>
          </section>

          {/* Publicação */}
          <section>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Publicação / ciência</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                Meio de intimação
                <select value={form.publicationMeans} onChange={(e) => set('publicationMeans', e.target.value)}>
                  {means.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                Data da publicação / ciência
                <input type="date" value={form.publicationDate} onChange={(e) => set('publicationDate', e.target.value)} />
              </label>
            </div>
          </section>

          {/* Prazo */}
          <section>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>Tipo de prazo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                Ato processual
                <select value={form.deadlineTypeKey} onChange={(e) => set('deadlineTypeKey', e.target.value)}>
                  {types.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}{t.days ? ` — ${t.days} ${t.type}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                Beneficiário do prazo
                <select value={form.beneficiary} onChange={(e) => set('beneficiary', e.target.value)}>
                  {BENEFICIARY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              {isCustom && (
                <>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                    Nº de dias (personalizado)
                    <input type="number" min="1" value={form.customDays} onChange={(e) => set('customDays', e.target.value)} placeholder="Ex.: 10" />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                    Tipo de contagem
                    <select value={form.customDayType} onChange={(e) => set('customDayType', e.target.value)}>
                      <option value="uteis">Dias úteis</option>
                      <option value="corridos">Dias corridos</option>
                    </select>
                  </label>
                </>
              )}
            </div>
          </section>

          {/* Observações */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
            Observações internas
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Ex.: Verificar suspensão por acordo de cooperação, feriado local em SP..." rows={2} style={{ resize: 'vertical' }} />
          </label>

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: '10px 14px', color: '#c53030', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Result preview */}
          {preview && uc && (
            <div style={{ background: uc.bg, border: `1px solid ${uc.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <strong style={{ color: uc.text, fontSize: 14 }}>{preview.deadlineLabel}</strong>
                <span style={{ background: uc.badge, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                  {URGENCY_LABEL[preview.urgency]}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
                <div><span style={{ color: '#718096' }}>Termo inicial: </span><strong>{formatDate(preview.startDate)}</strong></div>
                <div><span style={{ color: '#718096' }}>Prazo final: </span><strong style={{ color: uc.text }}>{formatDate(preview.deadlineDate)}</strong></div>
                <div><span style={{ color: '#718096' }}>Dias: </span><strong>{preview.days} {preview.dayType}</strong>{preview.doubled && <span style={{ color: '#c05621', marginLeft: 4, fontSize: 11 }}>(dobro)</span>}</div>
                <div><span style={{ color: '#718096' }}>Dias úteis restantes: </span><strong>{preview.daysLeft}</strong></div>
                <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#718096' }}>Fundamento: </span><em style={{ fontSize: 12 }}>{preview.legalRef}</em></div>
                <div><span style={{ color: '#718096' }}>Alerta T−3: </span><strong>{formatDate(preview.alert3)}</strong></div>
                <div><span style={{ color: '#718096' }}>Alerta T−1: </span><strong>{formatDate(preview.alert1)}</strong></div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#718096', borderTop: `1px solid ${uc.border}`, paddingTop: 8 }}>
                ⚠️ Validar no calculador oficial do tribunal e conferir feriados locais. Este cálculo não substitui conferência humana.
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ background: '#edf2f7', color: '#4a5568', padding: '9px 20px' }}>
              Cancelar
            </button>
            <button
              onClick={handleCalculate}
              disabled={loading || !form.publicationDate}
              style={{ background: '#2b6cb0', color: '#fff', padding: '9px 20px', fontWeight: 600 }}
            >
              {loading ? '⏳ Calculando...' : '🔢 Calcular Prazo'}
            </button>
            {preview && (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: '#276749', color: '#fff', padding: '9px 20px', fontWeight: 600 }}
              >
                {saving ? '⏳ Salvando...' : '💾 Salvar Prazo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
