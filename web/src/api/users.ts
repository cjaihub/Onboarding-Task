import { apiClient } from '../lib/api-client';
import { User, PaginatedResponse } from '../types/api';

export async function fetchUsers(): Promise<User[]> {
  // Since our UserViewSet is ReadOnlyModelViewSet, it returns paginated response.
  const response = await apiClient<PaginatedResponse<User> | User[]>('/users/');
  if (Array.isArray(response)) return response;
  return response.results || [];
}
