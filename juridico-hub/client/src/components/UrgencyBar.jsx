import React from 'react';

const COLORS = ['#68d391', '#f6e05e', '#f6ad55', '#fc8181', '#e53e3e'];
const LABELS = ['', 'Baixa', 'Normal', 'Média', 'Alta', 'Urgente'];

export default function UrgencyBar({ urgency = 3 }) {
  const u = Math.max(1, Math.min(5, urgency));
  return (
    <span title={`Urgência: ${LABELS[u]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{
          display: 'inline-block',
          width: 8, height: 8,
          borderRadius: '50%',
          background: i <= u ? COLORS[u - 1] : '#e2e8f0',
        }} />
      ))}
      <span style={{ marginLeft: 4, fontSize: 11, color: '#718096' }}>{LABELS[u]}</span>
    </span>
  );
}
