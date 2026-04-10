import React from 'react';

const CONFIG = {
  novo:        { label: 'Novo',        color: '#2b6cb0', bg: '#ebf8ff', border: '#90cdf4' },
  qualificado: { label: 'Qualificado', color: '#276749', bg: '#f0fff4', border: '#9ae6b4' },
  convertido:  { label: 'Convertido',  color: '#744210', bg: '#fffbeb', border: '#f6e05e' },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.novo;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '.4px',
      textTransform: 'uppercase',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}
