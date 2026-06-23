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
    throw new Error(errorData.detail || 'API request failed');
  }

  return response.json();
}
