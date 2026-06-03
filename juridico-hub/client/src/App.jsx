import React, { useState, useEffect, useCallback } from 'react';
import LeadCard from './components/LeadCard';
import QualifyModal from './components/QualifyModal';
import DeadlineCalculatorModal from './components/DeadlineCalculatorModal';
import DeadlineCard from './components/DeadlineCard';
import FerramentaModal from './components/FerramentaModal';
import WhatsAppPanel from './components/WhatsAppPanel';
import { api } from './api';

// ─── Leads section ────────────────────────────────────────────────────────────

const LEAD_TABS = [
  { value: '',            label: 'Todos' },
  { value: 'novo',        label: 'Novo' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'convertido',  label: 'Convertido' },
];

function LeadsSection() {
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
  useEffect(() => { const t = setTimeout(loadLeads, 300); return () => clearTimeout(t); }, [search]); // eslint-disable-line

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

  return (
    <>
      {/* Stats */}
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

      {monitorMsg && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 8, fontSize: 13 }}>
          {monitorMsg}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {LEAD_TABS.map((tab) => {
            const count = !tab.value ? stats.total : (stats.byStatus?.[tab.value] || 0);
            return (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{
                background: activeTab === tab.value ? '#2b6cb0' : '#edf2f7',
                color: activeTab === tab.value ? '#fff' : '#4a5568',
                padding: '5px 14px', fontWeight: activeTab === tab.value ? 700 : 400,
              }}>
                {tab.label} <span style={{ opacity: .7, fontSize: 11 }}>({count})</span>
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Buscar por autor, cidade, tipo de caso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, maxWidth: 340 }}
        />
        <button onClick={loadLeads} style={{ background: '#edf2f7', color: '#4a5568' }}>↻ Atualizar</button>
        <button onClick={() => handleMonitorRun(true)} disabled={monitorLoading} style={{ background: '#edf2f7', color: '#4a5568' }}>
          {monitorLoading ? '⏳' : '🔄'} Importar JusBrasil
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13 }}>
          Erro: {error}. Verifique se o servidor está rodando em localhost:3001.
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>Carregando leads...
        </div>
      ) : leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Nenhum lead encontrado</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
            <button onClick={() => handleMonitorRun(true)} disabled={monitorLoading} style={{ background: '#2b6cb0', color: '#fff', padding: '9px 20px' }}>
              🔄 Importar do JusBrasil (demo)
            </button>
            <button onClick={() => setShowQualify(true)} style={{ background: '#276749', color: '#fff', padding: '9px 20px' }}>
              💬 Qualificar Mensagem
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead}
              onUpdated={(u) => setLeads((prev) => prev.map((l) => l.id === u.id ? u : l))}
            />
          ))}
        </div>
      )}

      {showQualify && (
        <QualifyModal
          onClose={() => setShowQualify(false)}
          onLeadCreated={(lead) => { setLeads((p) => [lead, ...p]); setShowQualify(false); }}
        />
      )}
    </>
  );
}

// ─── Prazos section ───────────────────────────────────────────────────────────

const URGENCY_FILTERS = [
  { value: '',         label: 'Todos' },
  { value: 'critico',  label: '🔴 Crítico' },
  { value: 'urgente',  label: '🟠 Urgente' },
  { value: 'normal',   label: '🟢 Normal' },
  { value: 'vencido',  label: '⚫ Vencido' },
];

function PrazosSection() {
  const [deadlines, setDeadlines] = useState([]);
  const [stats, setStats] = useState({ total: 0, ativo: 0, critico: 0, urgente: 0, normal: 0, vencido: 0 });
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ativo');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dl, st] = await Promise.all([
        api.deadlines.list({ status: statusFilter, urgency: filter, search }),
        api.deadlines.stats(),
      ]);
      setDeadlines(dl);
      setStats(st);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, statusFilter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]); // eslint-disable-line

  function handleSaved(saved) {
    setDeadlines((prev) => [saved, ...prev]);
    setStats((s) => ({ ...s, total: s.total + 1, ativo: s.ativo + 1, [saved.urgency]: (s[saved.urgency] || 0) + 1 }));
  }

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Ativos', value: stats.ativo, color: '#2b6cb0', bg: '#ebf8ff', icon: '📋' },
          { label: 'Crítico', value: stats.critico, color: '#c53030', bg: '#fff5f5', icon: '🔴' },
          { label: 'Urgente', value: stats.urgente, color: '#c05621', bg: '#fffaf0', icon: '🟠' },
          { label: 'Normal', value: stats.normal, color: '#276749', bg: '#f0fff4', icon: '🟢' },
          { label: 'Vencido', value: stats.vencido, color: '#718096', bg: '#f7fafc', icon: '⚫' },
        ].map(({ label, value, color, bg, icon }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: '#718096', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {URGENCY_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              background: filter === f.value ? '#2b6cb0' : '#edf2f7',
              color: filter === f.value ? '#fff' : '#4a5568',
              padding: '5px 12px', fontWeight: filter === f.value ? 700 : 400, fontSize: 12,
            }}>
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ fontSize: 12, padding: '5px 10px' }}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <input
          type="text"
          placeholder="Buscar processo, parte, vara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, maxWidth: 300 }}
        />
        <button onClick={load} style={{ background: '#edf2f7', color: '#4a5568' }}>↻</button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, color: '#c53030', fontSize: 13 }}>
          Erro: {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>Carregando prazos...
        </div>
      ) : deadlines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Nenhum prazo cadastrado</div>
          <button onClick={() => setShowCalc(true)} style={{ background: '#2b6cb0', color: '#fff', padding: '9px 20px', marginTop: 12 }}>
            ➕ Calcular Primeiro Prazo
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {deadlines.map((dl) => (
            <DeadlineCard
              key={dl.id}
              deadline={dl}
              onUpdated={(u) => setDeadlines((prev) => prev.map((d) => d.id === u.id ? u : d))}
              onDeleted={(id) => setDeadlines((prev) => prev.filter((d) => d.id !== id))}
            />
          ))}
        </div>
      )}

      {showCalc && (
        <DeadlineCalculatorModal
          onClose={() => setShowCalc(false)}
          onSaved={(saved) => { handleSaved(saved); setShowCalc(false); }}
        />
      )}

      {/* Warning */}
      <div style={{ marginTop: 20, padding: '10px 16px', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 8, fontSize: 12, color: '#7b341e' }}>
        ⚠️ <strong>Aviso de responsabilidade:</strong> Erro de prazo é alto risco. Sempre cruzar com 2 fontes (sistema do tribunal + planilha do escritório) e validar com o advogado responsável. Este calculador considera feriados nacionais e recesso CPC (20/dez–20/jan). Feriados locais e suspensões específicas devem ser verificados manualmente.
      </div>
    </>
  );
}

// ─── Ferramentas section ──────────────────────────────────────────────────────

function FerramentasSection() {
  const [tools, setTools] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.ferramentas.list()
      .then(setTools)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>⏳ Carregando ferramentas...</div>;
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#1a365d', marginBottom: 6 }}>Ferramentas de IA Jurídica</div>
        <div style={{ color: '#718096', fontSize: 13 }}>
          Assistentes especializados powered by Claude — requerem <code>ANTHROPIC_API_KEY</code> configurada no servidor.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {tools.map((tool) => (
          <div
            key={tool.key}
            onClick={() => setActiveTool(tool)}
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all .15s',
              boxShadow: '0 1px 3px rgba(0,0,0,.05)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(43,108,176,.15)';
              e.currentTarget.style.borderColor = '#90cdf4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.05)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>{tool.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a365d', marginBottom: 6 }}>{tool.label}</div>
            <div style={{ fontSize: 12, color: '#718096', lineHeight: 1.5 }}>{tool.description}</div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#2b6cb0', fontWeight: 600 }}>
              Abrir ferramenta →
            </div>
          </div>
        ))}
      </div>

      {activeTool && (
        <FerramentaModal tool={activeTool} onClose={() => setActiveTool(null)} />
      )}
    </>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  { key: 'leads',       label: '📋 Leads',       action: null },
  { key: 'prazos',      label: '⏱️ Prazos',      action: null },
  { key: 'ferramentas', label: '🛠️ Ferramentas', action: null },
];

export default function App() {
  const [section, setSection] = useState('leads');
  const [showQualify, setShowQualify] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showWA, setShowWA] = useState(false);
  const [waStatus, setWaStatus] = useState('disconnected');

  useEffect(() => {
    let interval;
    function pollWA() {
      api.whatsapp.status()
        .then((s) => setWaStatus(s.status))
        .catch(() => {});
    }
    pollWA();
    interval = setInterval(pollWA, 5000);
    return () => clearInterval(interval);
  }, []);

  const waColor = { ready: '#25D366', qr_pending: '#dd6b20', connecting: '#d69e2e', auth_failure: '#e53e3e', disconnected: '#a0aec0' }[waStatus] || '#a0aec0';
  const waLabel = { ready: '● WA', qr_pending: '◌ WA', connecting: '◌ WA', auth_failure: '✕ WA', disconnected: '○ WA' }[waStatus] || '○ WA';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Header */}
      <header style={{ background: '#1a365d', color: '#fff', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>⚖️</span>
            <span style={{ fontWeight: 800, fontSize: 17 }}>Jurídico Hub</span>
          </div>

          {/* Section nav */}
          <div style={{ display: 'flex', gap: 2 }}>
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                style={{
                  background: section === s.key ? 'rgba(255,255,255,.2)' : 'transparent',
                  color: '#fff',
                  padding: '6px 16px',
                  fontWeight: section === s.key ? 700 : 400,
                  fontSize: 13,
                  borderRadius: 6,
                  border: section === s.key ? '1px solid rgba(255,255,255,.3)' : '1px solid transparent',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setShowWA(true)}
              style={{ background: 'transparent', color: waColor, padding: '5px 12px', fontSize: 13, fontWeight: 700, border: `1px solid ${waColor}66`, borderRadius: 6 }}
              title="WhatsApp automático"
            >
              {waLabel}
            </button>
            {section === 'leads' && (
              <button onClick={() => setShowQualify(true)} style={{ background: '#276749', color: '#fff', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
                💬 Qualificar
              </button>
            )}
            {section === 'prazos' && (
              <button onClick={() => setShowCalc(true)} style={{ background: '#2b6cb0', color: '#fff', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
                ➕ Novo Prazo
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {section === 'leads'       && <LeadsSection />}
        {section === 'prazos'      && <PrazosSection />}
        {section === 'ferramentas' && <FerramentasSection />}
      </main>

      {showQualify && (
        <QualifyModal
          onClose={() => setShowQualify(false)}
          onLeadCreated={() => setShowQualify(false)}
        />
      )}

      {showCalc && (
        <DeadlineCalculatorModal
          onClose={() => setShowCalc(false)}
          onSaved={() => { setShowCalc(false); setSection('prazos'); }}
        />
      )}

      {showWA && <WhatsAppPanel onClose={() => setShowWA(false)} />}
    </div>
  );
}
