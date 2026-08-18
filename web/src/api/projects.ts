import { apiClient } from '../lib/api-client';
import { Project, PaginatedResponse } from '../types/api';

export async function fetchProjects(): Promise<Project[]> {
  const response = await apiClient<PaginatedResponse<Project> | Project[]>('/projects/');
  if (Array.isArray(response)) return response;
  return response.results || [];
}
