import { ApiError } from '../types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    throw { message: 'Network failure', data: error } as ApiError;
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
        error.message = data.status; // For transition_work_item specific errors (like "Assignee required")
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
