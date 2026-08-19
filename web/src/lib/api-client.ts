import { ApiError } from '../types/api';
import { getAccessToken, refreshAccessToken } from '../api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else {
    throw { message: 'Server returned non-JSON response', status: response.status } as ApiError;
  }
}

export async function downloadFile(url: string, filename: string) {
  const authHeaders = await buildAuthHeaders();
  
  // If the url is relative and doesn't start with http, prepend API URL origin
  let fetchUrl = url;
  if (url.startsWith('/')) {
    // Fallback if API_URL is relative like '/api'
    const origin = API_URL.startsWith('http') ? new URL(API_URL).origin : (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000');
    fetchUrl = `${origin}${url}`;
  }

  let response = await fetch(fetchUrl, { headers: authHeaders });

  // Handle 401 retry if token expired
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      authHeaders['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(fetchUrl, { headers: authHeaders });
    }
  }

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
