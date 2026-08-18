import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWorkItems, fetchWorkItem, transitionWorkItem } from '../api/workItems';
import { fetchDashboardStats } from '../api/dashboard';
import { fetchComments, fetchActivity } from '../api/comments';
import { fetchUsers } from '../api/users';
import { fetchProjects } from '../api/projects';
import { fetchMetadata } from '../api/metadata';
import { WorkItemFilters, Status } from '../types/api';

export const queryKeys = {
  workItems: (filters?: WorkItemFilters) => ['workItems', filters] as const,
  workItem: (id: number) => ['workItem', id] as const,
  dashboard: ['dashboard'] as const,
  comments: (id: number) => ['comments', id] as const,
  activity: (id: number) => ['activity', id] as const,
  users: ['users'] as const,
  projects: ['projects'] as const,
  metadata: ['metadata'] as const,
};

export function useWorkItemsQuery(filters?: WorkItemFilters) {
  return useQuery({
    queryKey: queryKeys.workItems(filters),
    queryFn: () => fetchWorkItems(filters),
  });
}

export function useWorkItemQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.workItem(id),
    queryFn: () => fetchWorkItem(id),
    enabled: !!id,
  });
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboardStats,
  });
}

export function useCommentsQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.comments(id),
    queryFn: () => fetchComments(id),
    enabled: !!id,
  });
}

export function useActivityQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.activity(id),
    queryFn: () => fetchActivity(id),
    enabled: !!id,
  });
}

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: fetchUsers,
  });
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
  });
}

export function useMetadataQuery() {
  return useQuery({
    queryKey: queryKeys.metadata,
    queryFn: fetchMetadata,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useTransitionWorkItemMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, resolutionNote }: { id: number; status: Status; resolutionNote?: string }) => 
      transitionWorkItem(id, status, resolutionNote),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to keep UI perfectly in sync
      queryClient.invalidateQueries({ queryKey: ['workItems'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workItem(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    }
  });
}
