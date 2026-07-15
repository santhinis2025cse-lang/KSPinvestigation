const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const apiFetch = async <T = unknown>(path: string, init: RequestInit = {}, requireAuth = true): Promise<T> => {
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');

  if (requireAuth) {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('ksp_auth_token') : null;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
};

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;
