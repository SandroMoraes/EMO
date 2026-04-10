import React, { useState, useEffect, useCallback } from 'react';
import KanbanBoard from './components/KanbanBoard';
import CampaignPanel from './components/CampaignPanel';
import StageBadge from './components/StageBadge';
import { api } from './api';

const TABS = [
  { key: 'pipeline', label: '🎯 Pipeline', icon: '🎯' },
  { key: 'campaigns', label: '📣 Campanhas', icon: '📣' },
  { key: 'contacts', label: '👥 Contatos', icon: '👥' },
];

export default function App() {
  const [tab, setTab] = useState('pipeline');
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ total:0, byStage:{} });
  const [loading, setLoading] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [search, setSearch] = useState('');
  const [newContact, setNewContact] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        api.contacts.list({ search }),
        api.contacts.stats(),
      ]);
      setContacts(c);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t=setTimeout(load,300); return ()=>clearTimeout(t); }, [search]);

  async function handleImport() {
    setImportMsg('⏳ Importando…');
    try {
      const r = await api.contacts.importHub();
      setImportMsg(`✅ ${r.imported} importado(s), ${r.skipped} já existentes`);
      load();
    } catch (e) {
      setImportMsg(`❌ ${e.message}`);
    }
    setTimeout(() => setImportMsg(''), 6000);
  }

  async function handleStageChange(id, stage) {
    const updated = await api.contacts.update(id, { stage });
    setContacts(p => p.map(c => c.id === id ? updated : c));
    api.contacts.stats().then(setStats).catch(()=>{});
  }

  async function handleCreateContact(e) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const c = await api.contacts.create({ ...fd, urgency: Number(fd.urgency)||3, source:'manual' });
    setContacts(p => [c, ...p]);
    setStats(s => ({ ...s, total: s.total+1, byStage: { ...s.byStage, novo:(s.byStage.novo||0)+1 } }));
    setNewContact(null);
  }

  const AREAS = ['Direito Previdenciário','Direito do Consumidor / Bancário',
    'Direito do Consumidor / Saúde','Direito Trabalhista','Direito de Família','Direito Geral'];

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* ── Header ── */}
      <header style={{ background:'#1e1b4b', color:'#fff', padding:'0 24px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', alignItems:'center',
          justifyContent:'space-between', height:56 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>🎯</span>
            <span style={{ fontWeight:800, fontSize:18 }}>SRCM Prospecção</span>
            <span style={{ opacity:.4, margin:'0 6px' }}>|</span>
            <span style={{ opacity:.65, fontSize:13 }}>Sistema de Relacionamento e Marketing Jurídico</span>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {importMsg && <span style={{ fontSize:12, opacity:.9 }}>{importMsg}</span>}
            <button onClick={handleImport}
              style={{ background:'rgba(255,255,255,.15)', color:'#fff', padding:'7px 14px' }}>
              ⬇ Importar do Hub
            </button>
            <button onClick={() => setNewContact({})}
              style={{ background:'#6366f1', color:'#fff', padding:'7px 14px', fontWeight:600 }}>
              + Novo Contato
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      <div style={{ background:'#312e81', padding:'12px 24px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', gap:16, flexWrap:'wrap' }}>
          {[
            { l:'Total', v: stats.total, c:'#a5b4fc' },
            { l:'Novos', v: stats.byStage?.novo||0, c:'#93c5fd' },
            { l:'Contatados', v: stats.byStage?.contatado||0, c:'#c4b5fd' },
            { l:'Reunião', v: stats.byStage?.reuniao||0, c:'#fcd34d' },
            { l:'Proposta', v: stats.byStage?.proposta||0, c:'#6ee7b7' },
            { l:'Convertidos', v: stats.byStage?.convertido||0, c:'#34d399' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ textAlign:'center', minWidth:80 }}>
              <div style={{ fontSize:22, fontWeight:800, color: c }}>{v}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.6)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 24px' }}>
        <div style={{ maxWidth:1400, margin:'0 auto', display:'flex', gap:0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background:'none', borderBottom: tab===t.key ? '2px solid #6366f1' : '2px solid transparent',
              color: tab===t.key ? '#6366f1' : '#64748b', padding:'12px 20px',
              borderRadius:0, fontWeight: tab===t.key ? 700 : 400, fontSize:14,
            }}>
              {t.label}
            </button>
          ))}
          {/* Search (only when not on campaigns) */}
          {tab !== 'campaigns' && (
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center' }}>
              <input placeholder="Buscar contato…" value={search}
                onChange={e=>setSearch(e.target.value)}
                style={{ width:220, fontSize:13 }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <main style={{ maxWidth:1400, margin:'0 auto', padding:'24px', overflowX:'auto' }}>
        {loading && tab !== 'campaigns' && (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#94a3b8' }}>
            ⏳ Carregando…
          </div>
        )}

        {!loading && tab === 'pipeline' && (
          <KanbanBoard contacts={contacts} onStageChange={handleStageChange} />
        )}

        {tab === 'campaigns' && (
          <CampaignPanel contacts={contacts} />
        )}

        {!loading && tab === 'contacts' && (
          <div>
            {contacts.length === 0
              ? <div style={{ textAlign:'center', padding:'60px 0', color:'#94a3b8' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                  <p style={{ marginBottom:16 }}>Nenhum contato. Importe do Jurídico Hub ou adicione manualmente.</p>
                  <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                    <button onClick={handleImport} style={{ background:'#6366f1', color:'#fff', padding:'9px 20px' }}>
                      ⬇ Importar do Hub
                    </button>
                    <button onClick={() => setNewContact({})} style={{ background:'#10b981', color:'#fff', padding:'9px 20px' }}>
                      + Adicionar Manualmente
                    </button>
                  </div>
                </div>
              : <table style={{ width:'100%', borderCollapse:'collapse', background:'#fff',
                  borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                      {['Nome','Cidade','Área','Tipo de Caso','Urgência','Estágio','Interações'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12,
                          fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.5px' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, i) => (
                      <tr key={c.id} style={{ borderBottom:'1px solid #f0f4f8',
                        background: i%2===0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding:'10px 14px', fontWeight:600 }}>{c.name}</td>
                        <td style={{ padding:'10px 14px', color:'#475569' }}>{c.city||'—'}</td>
                        <td style={{ padding:'10px 14px', fontSize:12, color:'#475569' }}>
                          {c.area?.split('/')[0]?.trim()||'—'}
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:12 }}>{c.caseType||'—'}</td>
                        <td style={{ padding:'10px 14px', textAlign:'center' }}>
                          <span style={{ fontWeight:700, color:['','#94a3b8','#64748b','#f59e0b','#ef4444','#dc2626'][c.urgency||3] }}>
                            {c.urgency||3}/5
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <select value={c.stage||'novo'}
                            onChange={async e => handleStageChange(c.id, e.target.value)}
                            style={{ fontSize:12, padding:'3px 8px' }}>
                            {['novo','contatado','reuniao','proposta','convertido','perdido'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding:'10px 14px', textAlign:'center', color:'#6366f1', fontWeight:700 }}>
                          {c.interactions?.length||0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        )}
      </main>

      {/* ── New Contact Modal ── */}
      {newContact !== null && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
          onClick={e => e.target===e.currentTarget && setNewContact(null)}>
          <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:500,
            boxShadow:'0 20px 60px rgba(0,0,0,.2)', overflow:'hidden' }}>
            <div style={{ background:'#6366f1', color:'#fff', padding:'14px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700 }}>Novo Contato</span>
              <button onClick={() => setNewContact(null)}
                style={{ background:'rgba(255,255,255,.2)', color:'#fff', padding:'3px 10px' }}>✕</button>
            </div>
            <form onSubmit={handleCreateContact} style={{ padding:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                {[
                  { name:'name', label:'Nome *', placeholder:'João Silva', required:true },
                  { name:'city', label:'Cidade', placeholder:'São Paulo - SP' },
                  { name:'phone', label:'WhatsApp', placeholder:'+55 11 99999-9999' },
                  { name:'email', label:'E-mail', placeholder:'joao@email.com' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>{f.label}</label>
                    <input name={f.name} required={f.required} placeholder={f.placeholder} style={{ width:'100%' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Área Jurídica</label>
                <select name="area" style={{ width:'100%' }}>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Resumo do Caso</label>
                <textarea name="summary" placeholder="Descreva brevemente a situação do cliente…" style={{ width:'100%' }} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button type="submit" style={{ background:'#6366f1', color:'#fff', padding:'9px 20px', flex:1 }}>
                  ✓ Salvar Contato
                </button>
                <button type="button" onClick={() => setNewContact(null)}
                  style={{ background:'#f1f5f9', color:'#475569', padding:'9px 16px' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
