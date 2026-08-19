import { apiClient } from '../lib/api-client';
import { Project, PaginatedResponse, ProjectAttachment, ProjectComment } from '../types/api';

export async function fetchProjects(): Promise<Project[]> {
  const response = await apiClient<PaginatedResponse<Project> | Project[]>('/projects/');
  if (Array.isArray(response)) return response;
  return response.results || [];
}

export async function getProject(id: number | string): Promise<Project> {
  return apiClient<Project>(`/projects/${id}/`);
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  return apiClient<Project>('/projects/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: number | string, data: Partial<Project>): Promise<Project> {
  return apiClient<Project>(`/projects/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function uploadProjectAttachment(projectId: number, file: File, description: string): Promise<ProjectAttachment> {
  const formData = new FormData();
  formData.append('project', projectId.toString());
  formData.append('file', file);
  formData.append('description', description);

  const token = localStorage.getItem('token');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/project-attachments/`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload attachment');
  }

  return response.json();
}

export async function deleteProjectAttachment(id: number): Promise<void> {
  return apiClient<void>(`/project-attachments/${id}/`, {
    method: 'DELETE',
  });
}

export async function createProjectComment(projectId: number, message: string): Promise<ProjectComment> {
  return apiClient<ProjectComment>('/project-comments/', {
    method: 'POST',
    body: JSON.stringify({ project: projectId, message }),
  });
}
