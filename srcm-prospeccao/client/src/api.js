const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' }, ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  contacts: {
    list:   (p = {}) => req(`/contacts?${new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([,v])=>v)))}`),
    get:    (id)     => req(`/contacts/${id}`),
    create: (body)   => req('/contacts', { method:'POST', body: JSON.stringify(body) }),
    update: (id, b)  => req(`/contacts/${id}`, { method:'PATCH', body: JSON.stringify(b) }),
    remove: (id)     => req(`/contacts/${id}`, { method:'DELETE' }),
    addInteraction: (id, b) => req(`/contacts/${id}/interactions`, { method:'POST', body: JSON.stringify(b) }),
    importHub: (b={}) => req('/contacts/import-hub', { method:'POST', body: JSON.stringify(b) }),
    stats:  ()       => req('/contacts/stats'),
  },
  campaigns: {
    list:       ()         => req('/campaigns'),
    get:        (id)       => req(`/campaigns/${id}`),
    create:     (b)        => req('/campaigns', { method:'POST', body: JSON.stringify(b) }),
    createAuto: (b)        => req('/campaigns/auto', { method:'POST', body: JSON.stringify(b) }),
    update:     (id, b)    => req(`/campaigns/${id}`, { method:'PATCH', body: JSON.stringify(b) }),
    remove:     (id)       => req(`/campaigns/${id}`, { method:'DELETE' }),
    run:        (id)       => req(`/campaigns/${id}/run`, { method:'POST' }),
    templates:  (p={})     => req(`/campaigns/templates?${new URLSearchParams(p)}`),
    stats:      ()         => req('/campaigns/stats'),
  },
};
