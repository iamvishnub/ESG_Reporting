const API_BASE_URL = 'https://esg-reporting-backend-docker.onrender.com';

let authCredentials = null;

export function setCredentials(username, password) {
  authCredentials = { username, password };
}

export function clearCredentials() {
  authCredentials = null;
}

export function isAuthenticated() {
  return authCredentials !== null;
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authCredentials) {
    headers.Authorization =
      'Basic ' +
      btoa(`${authCredentials.username}:${authCredentials.password}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Error('Invalid credentials or login required.');
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to perform this action.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
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

  patch: (endpoint, data) =>
    request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (endpoint) =>
    request(endpoint, {
      method: 'DELETE',
    }),
};