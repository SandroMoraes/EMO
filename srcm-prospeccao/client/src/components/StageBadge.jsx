import React from 'react';

const CFG = {
  novo:        { label: 'Novo',        color: '#1d4ed8', bg: '#eff6ff' },
  contatado:   { label: 'Contatado',   color: '#6d28d9', bg: '#f5f3ff' },
  reuniao:     { label: 'Reunião',     color: '#b45309', bg: '#fffbeb' },
  proposta:    { label: 'Proposta',    color: '#065f46', bg: '#ecfdf5' },
  convertido:  { label: 'Convertido',  color: '#064e3b', bg: '#d1fae5' },
  perdido:     { label: 'Perdido',     color: '#991b1b', bg: '#fef2f2' },
};

export default function StageBadge({ stage }) {
  const c = CFG[stage] || CFG.novo;
  return (
    <span style={{ display:'inline-block', padding:'2px 10px', borderRadius:99,
      fontSize:11, fontWeight:700, letterSpacing:'.4px', textTransform:'uppercase',
      color: c.color, background: c.bg, border:`1px solid ${c.color}33` }}>
      {c.label}
    </span>
  );
}
