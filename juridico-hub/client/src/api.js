const BASE = '/api';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  leads: {
    list: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString();
      return request(`/leads${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/leads/${id}`),
    updateStatus: (id, status) =>
      request(`/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    generateResponse: (id) =>
      request(`/leads/${id}/response`, { method: 'POST' }),
    stats: () => request('/leads/stats'),
  },

  qualify: (message, save = true) =>
    request('/qualify', {
      method: 'POST',
      body: JSON.stringify({ message, save }),
    }),

  monitor: {
    run: (demo = false) =>
      request('/monitor/run', {
        method: 'POST',
        body: JSON.stringify({ demo }),
      }),
  },

  deadlines: {
    types: () => request('/deadlines/types'),
    stats: () => request('/deadlines/stats'),
    list: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString();
      return request(`/deadlines${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/deadlines/${id}`),
    calculate: (data) => request('/deadlines/calculate', { method: 'POST', body: JSON.stringify(data) }),
    create: (data) => request('/deadlines', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status) =>
      request(`/deadlines/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    remove: (id) => request(`/deadlines/${id}`, { method: 'DELETE' }),
  },

  ferramentas: {
    list: () => request('/ferramentas'),
    run: (tool, data) =>
      request(`/ferramentas/${tool}`, { method: 'POST', body: JSON.stringify(data) }),
  },

  whatsapp: {
    status: () => request('/whatsapp/status'),
    qr: () => request('/whatsapp/qr'),
    connect: () => request('/whatsapp/connect', { method: 'POST' }),
    disconnect: () => request('/whatsapp/disconnect', { method: 'POST' }),
    setAutoReply: (autoReply) =>
      request('/whatsapp/settings', { method: 'PATCH', body: JSON.stringify({ autoReply }) }),
  },
};
