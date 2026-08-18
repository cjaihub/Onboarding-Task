import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkItem, updateWorkItem, transitionWorkItem } from '../api/workItems';
import { createComment } from '../api/comments';
import { queryKeys } from './queries';
import { WorkItem, Status } from '../types/api';

export function useCreateWorkItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<WorkItem>) => createWorkItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateWorkItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkItem> }) =>
      updateWorkItem(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workItem(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(variables.id) });
    },
  });
}

import { assignWorkItem } from '../api/workItems';

export function useAssignWorkItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) =>
      assignWorkItem(id, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workItem(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(variables.id) });
    },
  });
}

export function useTransitionWorkItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, resolutionNote }: { id: number; status: Status; resolutionNote?: string }) =>
      transitionWorkItem(id, status, resolutionNote),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workItem(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(variables.id) });
    },
  });
}

export function useCreateCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, message, attachment }: { id: number; message: string; attachment?: File }) =>
      createComment(id, message, attachment),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(variables.id) });
    },
  });
}
