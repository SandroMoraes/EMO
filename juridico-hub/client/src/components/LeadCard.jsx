import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import UrgencyBar from './UrgencyBar';
import AIResponseModal from './AIResponseModal';
import { api } from '../api';

const SOURCE_ICON = { jusbrasil: '⚖️', whatsapp: '💬', manual: '✏️' };
const SOURCE_LABEL = { jusbrasil: 'JusBrasil', whatsapp: 'WhatsApp', manual: 'Manual' };

export default function LeadCard({ lead: initialLead, onUpdated }) {
  const [lead, setLead] = useState(initialLead);
  const [showAI, setShowAI] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  function handleLeadUpdate(updated) {
    setLead(updated);
    onUpdated?.(updated);
  }

  async function handleStatusChange(e) {
    const status = e.target.value;
    setStatusLoading(true);
    try {
      const updated = await api.leads.updateStatus(lead.id, status);
      handleLeadUpdate(updated);
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusLoading(false);
    }
  }

  const dateStr = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <>
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'box-shadow .15s',
      }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.06)'}
      >
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, marginBottom: 4 }}>
              {lead.title || lead.caseType}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <StatusBadge status={lead.status} />
              <span style={{ fontSize: 11, color: '#718096' }}>
                {SOURCE_ICON[lead.source] || '📄'} {SOURCE_LABEL[lead.source] || lead.source}
              </span>
              <span style={{ fontSize: 11, color: '#718096' }}>{dateStr}</span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 12 }}>
          <div><span style={{ color: '#718096' }}>Autor: </span><strong>{lead.author || '—'}</strong></div>
          <div><span style={{ color: '#718096' }}>Cidade: </span><strong>{lead.city || '—'}</strong></div>
          <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#718096' }}>Tipo: </span><strong>{lead.caseType}</strong></div>
          <div style={{ gridColumn: '1/-1' }}>
            <span style={{ color: '#718096', marginRight: 6 }}>Urgência:</span>
            <UrgencyBar urgency={lead.urgency} />
          </div>
        </div>

        {/* Snippet */}
        {lead.summary && (
          <p style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5, margin: 0, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
            {lead.summary.length > 140 ? `${lead.summary.slice(0, 137)}…` : lead.summary}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
          <select
            value={lead.status}
            onChange={handleStatusChange}
            disabled={statusLoading}
            style={{ width: 'auto', flex: 1, minWidth: 120, fontSize: 12 }}
          >
            <option value="novo">Novo</option>
            <option value="qualificado">Qualificado</option>
            <option value="convertido">Convertido</option>
          </select>

          <button
            onClick={() => setShowAI(true)}
            style={{
              background: lead.aiResponse ? '#276749' : '#2b6cb0',
              color: '#fff',
              padding: '6px 12px',
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            {lead.aiResponse ? '✓ Ver Resposta IA' : '✨ Gerar Resposta IA'}
          </button>

          {lead.url && (
            <a
              href={lead.url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: '#2b6cb0', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              🔗 Ver fonte
            </a>
          )}
        </div>
      </div>

      {showAI && (
        <AIResponseModal
          lead={lead}
          onClose={() => setShowAI(false)}
          onUpdated={handleLeadUpdate}
        />
      )}
    </>
  );
}
