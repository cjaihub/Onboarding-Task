import { apiClient } from '../lib/api-client';
import { WorkItem, PaginatedResponse, WorkItemFilters, Status } from '../types/api';

export async function fetchWorkItems(filters?: WorkItemFilters): Promise<PaginatedResponse<WorkItem>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  const queryString = params.toString();
  const endpoint = queryString ? `/work-items/?${queryString}` : '/work-items/';
  return apiClient<PaginatedResponse<WorkItem>>(endpoint);
}

export async function fetchWorkItem(id: number): Promise<WorkItem> {
  return apiClient<WorkItem>(`/work-items/${id}/`);
}

export async function createWorkItem(data: Partial<WorkItem>): Promise<WorkItem> {
  return apiClient<WorkItem>('/work-items/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWorkItem(id: number, data: Partial<WorkItem>): Promise<WorkItem> {
  return apiClient<WorkItem>(`/work-items/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function transitionWorkItem(id: number, status: Status, resolutionNote?: string): Promise<WorkItem> {
  const body: { status: Status; resolution_note?: string } = { status };
  if (resolutionNote) {
    body.resolution_note = resolutionNote;
  }
  return apiClient<WorkItem>(`/work-items/${id}/transition/`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function assignWorkItem(id: number, userId: number): Promise<WorkItem> {
  return apiClient<WorkItem>(`/work-items/${id}/assign/`, {
    method: 'POST',
    body: JSON.stringify({ assigned_to: userId }),
  });
}
