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
};
