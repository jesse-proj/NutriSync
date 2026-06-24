const API_URL = 'http://127.0.0.1:8000';

interface FetchOptions extends RequestInit {
  json?: any;
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers, ...customConfig } = options;
  const token = localStorage.getItem('token');

  // Set default Headers
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config: RequestInit = {
    method: json ? 'POST' : 'GET',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  };

  if (json) {
    config.body = JSON.stringify(json);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  // Catch expired or invalid tokens (401)
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    // If not already on login/register pages, redirect to login
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }
    throw new Error('Session unauthorized or expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = 'API request failed';
    if (errorData.detail) {
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      } else if (typeof errorData.detail === 'object') {
        errorMessage = JSON.stringify(errorData.detail);
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
