import { ApiError } from '../types/api';
import { getAccessToken, refreshAccessToken } from '../api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

async function buildAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {};

  let token = getAccessToken();
  if (!token) {
    // No access token — try refresh before giving up
    token = await refreshAccessToken();
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Keep X-User-ID for MockAuthMiddleware fallback during migration
  const userId = localStorage.getItem('userId');
  if (userId) headers['X-User-ID'] = userId;

  return headers;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const authHeaders = await buildAuthHeaders();

  const headers: Record<string, string> = {
    ...authHeaders,
    ...(options.headers as Record<string, string>),
  };

  // Only set application/json if the body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = { ...options, headers };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    throw { message: 'Network failure', data: error } as ApiError;
  }

  // If 401 and we haven't already retried, refresh token and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      try {
        response = await fetch(url, { ...config, headers });
      } catch (error) {
        throw { message: 'Network failure', data: error } as ApiError;
      }
    }
  }

  if (!response.ok) {
    const error: ApiError = {
      message: 'API Error',
      status: response.status,
    };
    try {
      const data = await response.json();
      error.data = data;
      if (data.detail) {
        error.message = data.detail;
      } else if (data.status && typeof data.status === 'string') {
        error.message = data.status;
      } else if (Object.keys(data).length > 0) {
        const firstKey = Object.keys(data)[0];
        if (Array.isArray(data[firstKey])) {
          error.message = `${firstKey}: ${data[firstKey][0]}`;
        }
      }
    } catch {
      error.message = response.statusText;
    }
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
