import { apiClient } from '../lib/api-client';
import { Comment, Activity } from '../types/api';

export async function fetchComments(workItemId: number): Promise<Comment[]> {
  return apiClient<Comment[]>(`/work-items/${workItemId}/comments/`);
}

export async function createComment(workItemId: number, message: string): Promise<Comment> {
  return apiClient<Comment>(`/work-items/${workItemId}/comments/`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function fetchActivity(workItemId: number): Promise<Activity[]> {
  return apiClient<Activity[]>(`/work-items/${workItemId}/activity/`);
}
