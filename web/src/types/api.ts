export type Status = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Comment {
  id: number;
  work_item: number;
  author: number;
  author_name: string;
  message: string;
  created_at: string;
}

export interface Activity {
  id: number;
  work_item: number;
  activity_type: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  timestamp: string;
}

export interface WorkItem {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  project: number;
  category: string;
  priority: Priority;
  status: Status;
  assigned_to: number | null;
  reported_by: number | null;
  due_date: string | null;
  resolution_note: string;
  created_at: string;
  updated_at: string;
  comments: Comment[];
  activities: Activity[];
}

export interface DashboardStats {
  total: number;
  open: number;
  in_progress: number;
  review: number;
  resolved: number;
  closed: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  status?: number;
  data?: Record<string, any>;
}

export interface WorkItemFilters {
  status?: Status;
  priority?: Priority;
  project?: number;
  assigned_to?: number;
  search?: string;
  ordering?: string;
  page?: number;
}
