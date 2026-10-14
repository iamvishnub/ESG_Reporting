
const API_BASE_URL = 'http://localhost:8080';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  checkHealth: () => request('/api/health'),

  get: (endpoint) => request(endpoint),

  post: (endpoint, data) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: (endpoint, data) =>
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (endpoint) =>
    request(endpoint, { method: 'DELETE' }),
};
