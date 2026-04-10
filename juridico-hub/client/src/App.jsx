import React, { useState, useEffect, useCallback } from 'react';
import LeadCard from './components/LeadCard';
import QualifyModal from './components/QualifyModal';
import { api } from './api';

const STATUS_TABS = [
  { value: '',            label: 'Todos' },
  { value: 'novo',        label: 'Novo' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'convertido',  label: 'Convertido' },
];

export default function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: {} });
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorMsg, setMonitorMsg] = useState('');
  const [showQualify, setShowQualify] = useState(false);
  const [error, setError] = useState('');

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [leadsData, statsData] = await Promise.all([
        api.leads.list({ status: activeTab, search }),
        api.leads.stats(),
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(loadLeads, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  async function handleMonitorRun(demo = true) {
    setMonitorLoading(true);
    setMonitorMsg('');
    try {
      const data = await api.monitor.run(demo);
      setMonitorMsg(`✅ ${data.message}`);
      loadLeads();
    } catch (e) {
      setMonitorMsg(`❌ ${e.message}`);
    } finally {
      setMonitorLoading(false);
      setTimeout(() => setMonitorMsg(''), 5000);
    }
  }

  function handleLeadUpdated(updated) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    api.leads.stats().then(setStats).catch(() => {});
  }

  function handleLeadCreated(lead) {
    setLeads((prev) => [lead, ...prev]);
    setStats((s) => ({ ...s, total: s.total + 1, byStatus: { ...s.byStatus, novo: (s.byStatus.novo || 0) + 1 } }));
  }

  const tabCount = (val) => {
    if (!val) return stats.total;
    return stats.byStatus?.[val] || 0;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Header */}
      <header style={{ background: '#1a365d', color: '#fff', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚖️</span>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.3px' }}>Jurídico Hub</span>
            <span style={{ opacity: .5, margin: '0 6px' }}>|</span>
            <span style={{ opacity: .7, fontSize: 13 }}>Dashboard de Leads</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowQualify(true)}
              style={{ background: '#276749', color: '#fff', padding: '7px 16px', fontWeight: 600 }}
            >
              💬 Qualificar Mensagem
            </button>
            <button
              onClick={() => handleMonitorRun(true)}
              disabled={monitorLoading}
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff', padding: '7px 14px' }}
              title="Importa leads do JusBrasil (modo demo)"
            >
              {monitorLoading ? '⏳' : '🔄'} Importar JusBrasil
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total de Leads', value: stats.total, color: '#2b6cb0', bg: '#ebf8ff', icon: '📋' },
            { label: 'Novos', value: stats.byStatus?.novo || 0, color: '#c05621', bg: '#fffaf0', icon: '🆕' },
            { label: 'Qualificados', value: stats.byStatus?.qualificado || 0, color: '#276749', bg: '#f0fff4', icon: '✅' },
            { label: 'Convertidos', value: stats.byStatus?.convertido || 0, color: '#744210', bg: '#fffbeb', icon: '🏆' },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#718096', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Monitor message */}
        {monitorMsg && (
          <div style={{ marginBottom: 16, padding: '10px 16px', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 8, fontSize: 13 }}>
            {monitorMsg}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  background: activeTab === tab.value ? '#2b6cb0' : '#edf2f7',
                  color: activeTab === tab.value ? '#fff' : '#4a5568',
                  padding: '5px 14px', fontWeight: activeTab === tab.value ? 700 : 400,
                }}
              >
                {tab.label} <span style={{ opacity: .7, fontSize: 11 }}>({tabCount(tab.value)})</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Buscar por autor, cidade, tipo de caso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, maxWidth: 340 }}
          />

          <button onClick={loadLeads} style={{ background: '#edf2f7', color: '#4a5568' }}>↻ Atualizar</button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13 }}>
            Erro: {error}. Verifique se o servidor está rodando em localhost:3001.
          </div>
        )}

        {/* Lead grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Carregando leads...
          </div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Nenhum lead encontrado</div>
            <p style={{ marginBottom: 20 }}>
              Importe leads do JusBrasil ou qualifique uma mensagem WhatsApp para começar.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => handleMonitorRun(true)}
                disabled={monitorLoading}
                style={{ background: '#2b6cb0', color: '#fff', padding: '9px 20px' }}
              >
                🔄 Importar do JusBrasil (demo)
              </button>
              <button
                onClick={() => setShowQualify(true)}
                style={{ background: '#276749', color: '#fff', padding: '9px 20px' }}
              >
                💬 Qualificar Mensagem
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onUpdated={handleLeadUpdated} />
            ))}
          </div>
        )}
      </main>

      {showQualify && (
        <QualifyModal
          onClose={() => setShowQualify(false)}
          onLeadCreated={(lead) => { handleLeadCreated(lead); setShowQualify(false); }}
        />
      )}
    </div>
  );
}
