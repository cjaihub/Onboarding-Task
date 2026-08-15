import { useQuery } from '@tanstack/react-query';
import { fetchWorkItems, fetchWorkItem } from '../api/workItems';
import { fetchDashboardStats } from '../api/dashboard';
import { fetchComments, fetchActivity } from '../api/comments';
import { WorkItemFilters } from '../types/api';

export const queryKeys = {
  workItems: (filters?: WorkItemFilters) => ['workItems', filters] as const,
  workItem: (id: number) => ['workItem', id] as const,
  dashboard: ['dashboard'] as const,
  comments: (id: number) => ['comments', id] as const,
  activity: (id: number) => ['activity', id] as const,
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
