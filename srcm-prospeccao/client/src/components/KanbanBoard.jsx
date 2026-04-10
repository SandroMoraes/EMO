import React, { useState } from 'react';
import StageBadge from './StageBadge';
import { api } from '../api';

const STAGES = [
  { key: 'novo',       label: 'Novo',       color: '#3b82f6' },
  { key: 'contatado',  label: 'Contatado',  color: '#8b5cf6' },
  { key: 'reuniao',    label: 'Reunião',    color: '#f59e0b' },
  { key: 'proposta',   label: 'Proposta',   color: '#10b981' },
  { key: 'convertido', label: 'Convertido', color: '#059669' },
  { key: 'perdido',    label: 'Perdido',    color: '#ef4444' },
];

function ContactCard({ contact, onStageChange }) {
  const [moving, setMoving] = useState(false);

  async function moveToStage(stage) {
    setMoving(true);
    try { await onStageChange(contact.id, stage); }
    finally { setMoving(false); }
  }

  const urgencyColor = ['','#94a3b8','#64748b','#f59e0b','#ef4444','#dc2626'][contact.urgency||3];

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8,
      padding:'10px 12px', marginBottom:8, boxShadow:'0 1px 2px rgba(0,0,0,.05)',
      borderLeft:`3px solid ${urgencyColor}` }}>
      <div style={{ fontWeight:600, fontSize:13, marginBottom:4, lineHeight:1.3 }}>
        {contact.name}
      </div>
      <div style={{ fontSize:11, color:'#64748b', marginBottom:6 }}>
        📍 {contact.city} &nbsp;·&nbsp; ⚖️ {contact.area?.split('/')[0]?.trim()}
      </div>
      {contact.summary && (
        <p style={{ fontSize:11, color:'#475569', marginBottom:8, lineHeight:1.4 }}>
          {contact.summary.length > 80 ? contact.summary.slice(0,77)+'…' : contact.summary}
        </p>
      )}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        {STAGES.filter(s => s.key !== contact.stage && s.key !== 'novo').map(s => (
          <button key={s.key} onClick={() => moveToStage(s.key)} disabled={moving}
            style={{ fontSize:10, padding:'2px 8px', background:'#f1f5f9', color:'#475569' }}>
            → {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ contacts, onStageChange }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12,
      overflowX:'auto', minWidth:900 }}>
      {STAGES.map(stage => {
        const cols = contacts.filter(c => c.stage === stage.key);
        return (
          <div key={stage.key} style={{ minWidth:180 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:10, paddingBottom:6, borderBottom:`2px solid ${stage.color}` }}>
              <span style={{ fontWeight:700, fontSize:12, color: stage.color, textTransform:'uppercase', letterSpacing:'.5px' }}>
                {stage.label}
              </span>
              <span style={{ background: stage.color+'22', color: stage.color,
                borderRadius:99, padding:'1px 8px', fontSize:11, fontWeight:700 }}>
                {cols.length}
              </span>
            </div>
            <div>
              {cols.length === 0
                ? <div style={{ fontSize:12, color:'#94a3b8', textAlign:'center', padding:'20px 0' }}>vazio</div>
                : cols.map(c => (
                    <ContactCard key={c.id} contact={c} onStageChange={onStageChange} />
                  ))
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}
