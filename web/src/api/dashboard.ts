import { apiClient } from '../lib/api-client';
import { DashboardStats } from '../types/api';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiClient<DashboardStats>('/dashboard/');
}
