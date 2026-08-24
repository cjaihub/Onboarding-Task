import { apiClient } from '../lib/api-client';
import { Comment, Activity } from '../types/api';

export async function fetchComments(workItemId: number): Promise<Comment[]> {
  return apiClient<Comment[]>(`/work-items/${workItemId}/comments/`);
}

export async function createComment(workItemId: number, message: string, attachment?: File): Promise<Comment> {
  if (attachment) {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('attachment', attachment);
    return apiClient<Comment>(`/work-items/${workItemId}/comments/`, {
      method: 'POST',
      body: formData,
    });
  } else {
    return apiClient<Comment>(`/work-items/${workItemId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

export async function fetchActivity(workItemId: number): Promise<Activity[]> {
  return apiClient<Activity[]>(`/work-items/${workItemId}/activity/`);
}

export async function updateComment(commentId: number, message: string): Promise<Comment> {
  return apiClient<Comment>(`/comments/${commentId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ message }),
  });
}

export async function deleteComment(commentId: number): Promise<void> {
  return apiClient<void>(`/comments/${commentId}/`, {
    method: 'DELETE',
  });
}
