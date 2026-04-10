import React, { useState, useEffect } from 'react';
import { api } from '../api';

const STATUS_COLOR = {
  rascunho: '#64748b', ativa: '#10b981', pausada: '#f59e0b', concluida: '#6366f1'
};

function CampaignCard({ campaign, contacts, onRun, onStatusChange, onDelete }) {
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleRun() {
    setRunning(true); setMsg('');
    try {
      const r = await onRun(campaign.id);
      setMsg(`✅ Enviados: ${r.sent}, pulados: ${r.skipped}${r.errors?.length ? `, erros: ${r.errors.length}` : ''}`);
    } catch(e) { setMsg(`❌ ${e.message}`); }
    finally { setRunning(false); setTimeout(()=>setMsg(''), 5000); }
  }

  const attached = contacts.filter(c => campaign.contactIds?.includes(c.id));

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10,
      padding:16, boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{campaign.name}</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, padding:'2px 10px', borderRadius:99, fontWeight:700,
              background: STATUS_COLOR[campaign.status]+'22', color: STATUS_COLOR[campaign.status] }}>
              {campaign.status}
            </span>
            {campaign.area && <span style={{ fontSize:11, color:'#64748b' }}>⚖️ {campaign.area}</span>}
            <span style={{ fontSize:11, color:'#64748b' }}>📱 {campaign.channel || 'whatsapp'}</span>
          </div>
        </div>
        <button onClick={() => onDelete(campaign.id)}
          style={{ background:'#fef2f2', color:'#dc2626', padding:'4px 10px', fontSize:12 }}>
          ✕
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
        {[
          ['Contatos', attached.length],
          ['Steps', campaign.steps?.length || 0],
          ['Enviados', campaign.sentCount || 0],
        ].map(([l, v]) => (
          <div key={l} style={{ background:'#f8fafc', borderRadius:6, padding:'6px 10px', textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'#6366f1' }}>{v}</div>
            <div style={{ fontSize:11, color:'#64748b' }}>{l}</div>
          </div>
        ))}
      </div>

      {msg && <div style={{ marginBottom:10, fontSize:12, color:'#475569' }}>{msg}</div>}

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {campaign.status === 'rascunho' && (
          <button onClick={() => onStatusChange(campaign.id,'ativa')}
            style={{ background:'#10b981', color:'#fff', padding:'6px 14px' }}>
            ▶ Ativar
          </button>
        )}
        {campaign.status === 'ativa' && <>
          <button onClick={handleRun} disabled={running}
            style={{ background:'#6366f1', color:'#fff', padding:'6px 14px' }}>
            {running ? '⏳ Enviando…' : '🚀 Disparar Agora'}
          </button>
          <button onClick={() => onStatusChange(campaign.id,'pausada')}
            style={{ background:'#f59e0b', color:'#fff', padding:'6px 14px' }}>
            ⏸ Pausar
          </button>
        </>}
        {campaign.status === 'pausada' && (
          <button onClick={() => onStatusChange(campaign.id,'ativa')}
            style={{ background:'#10b981', color:'#fff', padding:'6px 14px' }}>
            ▶ Retomar
          </button>
        )}
        <button onClick={() => onStatusChange(campaign.id,'concluida')}
          style={{ background:'#eef2ff', color:'#6366f1', padding:'6px 14px' }}>
          ✓ Concluir
        </button>
      </div>
    </div>
  );
}

export default function CampaignPanel({ contacts }) {
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', area:'', channel:'whatsapp', contactIds:[] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const AREAS = [
    'Direito Previdenciário',
    'Direito do Consumidor / Bancário',
    'Direito do Consumidor / Saúde',
    'Direito Trabalhista',
    'Direito de Família',
    'Direito Geral',
  ];

  useEffect(() => { load(); }, []);

  async function load() {
    try { setCampaigns(await api.campaigns.list()); } catch {}
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const c = await api.campaigns.createAuto(form);
      setCampaigns(p => [c, ...p]);
      setShowForm(false);
      setForm({ name:'', area:'', channel:'whatsapp', contactIds:[] });
    } catch(e) { setMsg(`❌ ${e.message}`); }
    finally { setSaving(false); }
  }

  async function handleRun(id) {
    return api.campaigns.run(id);
  }

  async function handleStatusChange(id, status) {
    const c = await api.campaigns.update(id, { status });
    setCampaigns(p => p.map(x => x.id === id ? c : x));
  }

  async function handleDelete(id) {
    if (!confirm('Excluir campanha?')) return;
    await api.campaigns.remove(id);
    setCampaigns(p => p.filter(x => x.id !== id));
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:700 }}>Campanhas de Prospecção</h2>
        <button onClick={() => setShowForm(v => !v)}
          style={{ background:'#6366f1', color:'#fff', padding:'8px 18px', fontWeight:600 }}>
          + Nova Campanha
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background:'#fff', border:'1px solid #e2e8f0',
          borderRadius:10, padding:20, marginBottom:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Nome</label>
              <input required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                placeholder="Ex: Campanha INSS Jun/26" style={{ width:'100%' }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Área Jurídica</label>
              <select required value={form.area} onChange={e=>setForm(p=>({...p,area:e.target.value}))} style={{ width:'100%' }}>
                <option value="">Selecione…</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>Canal</label>
              <select value={form.channel} onChange={e=>setForm(p=>({...p,channel:e.target.value}))} style={{ width:'100%' }}>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, fontWeight:600, display:'block', marginBottom:4 }}>
              Contatos ({contacts.length} disponíveis)
            </label>
            <div style={{ maxHeight:120, overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:6, padding:8 }}>
              {contacts.length === 0
                ? <span style={{ fontSize:12, color:'#94a3b8' }}>Nenhum contato. Importe do hub primeiro.</span>
                : contacts.map(c => (
                    <label key={c.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, fontSize:13, cursor:'pointer' }}>
                      <input type="checkbox"
                        checked={form.contactIds.includes(c.id)}
                        onChange={e => setForm(p => ({
                          ...p,
                          contactIds: e.target.checked
                            ? [...p.contactIds, c.id]
                            : p.contactIds.filter(x => x !== c.id)
                        }))} />
                      {c.name} — {c.city}
                    </label>
                  ))
              }
            </div>
          </div>
          {msg && <div style={{ marginBottom:10, fontSize:12, color:'#dc2626' }}>{msg}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <button type="submit" disabled={saving}
              style={{ background:'#6366f1', color:'#fff', padding:'8px 20px' }}>
              {saving ? '⏳ Criando…' : '✓ Criar Campanha'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ background:'#f1f5f9', color:'#475569', padding:'8px 16px' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {campaigns.length === 0
        ? <div style={{ textAlign:'center', padding:'60px 0', color:'#94a3b8' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <p>Nenhuma campanha criada. Importe contatos e crie sua primeira campanha.</p>
          </div>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
            {campaigns.map(c => (
              <CampaignCard key={c.id} campaign={c} contacts={contacts}
                onRun={handleRun} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
      }
    </div>
  );
}
