const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function request(path, options = {}) {
  const { token, body, headers = {}, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('pulse:unauthorized'));
    }
    throw new ApiError(payload?.error || `Request failed (${response.status})`, response.status);
  }
  return payload;
}

export { API_URL };
