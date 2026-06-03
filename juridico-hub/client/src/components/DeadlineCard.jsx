import React, { useState } from 'react';
import { api } from '../api';

const URGENCY = {
  critico:  { label: '🔴 CRÍTICO',  bg: '#fff5f5', border: '#fc8181', text: '#c53030' },
  urgente:  { label: '🟠 URGENTE',  bg: '#fffaf0', border: '#fbd38d', text: '#c05621' },
  normal:   { label: '🟢 NORMAL',   bg: '#f0fff4', border: '#9ae6b4', text: '#276749' },
  vencido:  { label: '⚫ VENCIDO',  bg: '#f7fafc', border: '#cbd5e0', text: '#718096' },
};

const STATUS_OPTS = [
  { value: 'ativo',     label: 'Ativo' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

function fmt(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

export default function DeadlineCard({ deadline: initial, onUpdated, onDeleted }) {
  const [dl, setDl] = useState(initial);
  const [statusLoading, setStatusLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const u = URGENCY[dl.urgency] || URGENCY.normal;
  const isActive = dl.status === 'ativo';

  async function handleStatusChange(e) {
    const status = e.target.value;
    setStatusLoading(true);
    try {
      const updated = await api.deadlines.updateStatus(dl.id, status);
      setDl(updated);
      onUpdated?.(updated);
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await api.deadlines.remove(dl.id);
      onDeleted?.(dl.id);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{
      background: isActive ? u.bg : '#f7fafc',
      border: `1px solid ${isActive ? u.border : '#e2e8f0'}`,
      borderRadius: 10,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
      opacity: dl.status !== 'ativo' ? 0.7 : 1,
      transition: 'box-shadow .15s',
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.05)'}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>
            {dl.deadlineLabel || dl.deadlineTypeKey}
          </div>
          {dl.processNumber && (
            <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>
              📁 {dl.processNumber}
            </div>
          )}
        </div>
        {isActive && (
          <span style={{ background: u.text, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {u.label}
          </span>
        )}
        {!isActive && (
          <span style={{ background: '#e2e8f0', color: '#718096', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
            {dl.status === 'concluido' ? '✅ Concluído' : '❌ Cancelado'}
          </span>
        )}
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 12 }}>
        <div>
          <span style={{ color: '#718096' }}>Prazo final: </span>
          <strong style={{ color: isActive ? u.text : '#718096' }}>{fmt(dl.deadlineDate)}</strong>
        </div>
        <div>
          <span style={{ color: '#718096' }}>Dias úteis restantes: </span>
          <strong>{isActive ? dl.daysLeft : '—'}</strong>
        </div>
        <div>
          <span style={{ color: '#718096' }}>Termo inicial: </span>
          <strong>{fmt(dl.startDate)}</strong>
        </div>
        <div>
          <span style={{ color: '#718096' }}>Publicação: </span>
          <strong>{fmt(dl.publicationDate)}</strong>
        </div>
      </div>

      {/* Meta */}
      <div style={{ fontSize: 12, color: '#4a5568', display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        {dl.court && <span>🏛️ {dl.court}</span>}
        {dl.intimatedParty && <span>👤 {dl.intimatedParty}</span>}
        {dl.decisionType && <span>📋 {dl.decisionType}</span>}
      </div>

      {/* Alerts */}
      {isActive && (
        <div style={{ fontSize: 11, color: '#718096', display: 'flex', gap: 12 }}>
          <span>⏰ T−3: {fmt(dl.alert3)}</span>
          <span>⏰ T−1: {fmt(dl.alert1)}</span>
        </div>
      )}

      {/* Legal ref */}
      {dl.legalRef && (
        <div style={{ fontSize: 11, color: '#718096', fontStyle: 'italic', borderTop: '1px solid #f0f0f0', paddingTop: 6 }}>
          {dl.legalRef}
        </div>
      )}

      {dl.notes && (
        <div style={{ fontSize: 11, color: '#4a5568', background: '#fffff0', border: '1px solid #fefcbf', borderRadius: 6, padding: '4px 8px' }}>
          📝 {dl.notes}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
        <select
          value={dl.status}
          onChange={handleStatusChange}
          disabled={statusLoading}
          style={{ flex: 1, fontSize: 12 }}
        >
          {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {confirmDelete ? (
          <>
            <button onClick={handleDelete} style={{ background: '#e53e3e', color: '#fff', padding: '5px 10px', fontSize: 12 }}>Confirmar</button>
            <button onClick={() => setConfirmDelete(false)} style={{ background: '#edf2f7', color: '#4a5568', padding: '5px 10px', fontSize: 12 }}>Cancelar</button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ background: 'transparent', color: '#e53e3e', padding: '5px 8px', fontSize: 13, border: '1px solid #feb2b2', borderRadius: 6 }} title="Excluir prazo">
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
