export type Status = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UserProfile {
  bio: string;
  role: string;
  avatar_url: string;
  phone_number: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile?: UserProfile;
}

export interface ProjectAttachment {
  id: number;
  project: number;
  uploaded_by?: number;
  uploaded_by_name?: string;
  file: string;
  file_url: string;
  description: string;
  created_at: string;
}

export interface ProjectComment {
  id: number;
  project: number;
  author: number;
  author_name: string;
  author_avatar?: string;
  message: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  tech_tools: string[];
  created_at: string;
  members?: number[];
  members_detail?: User[];
  attachments?: ProjectAttachment[];
  comments?: ProjectComment[];
}

export interface MetadataOption {
  value: string;
  label: string;
}

export interface AppMetadata {
  project_types: MetadataOption[];
  tech_tools: MetadataOption[];
}

export interface Comment {
  id: number;
  work_item: number;
  author: number;
  author_name: string;
  message: string;
  attachment?: string | null;
  created_at: string;
}

export interface Activity {
  id: number;
  work_item: number;
  actor?: number;
  actor_name?: string;
  activity_type: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
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
  tags: string[];
}

export interface DashboardStats {
  total: number;
  open: number;
  in_progress: number;
  review: number;
  resolved: number;
  closed: number;
  critical: number;
  overdue: number;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
  recent_activity: Activity[];
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
  data?: Record<string, unknown>;
}

export interface WorkItemFilters {
  status?: Status;
  priority?: Priority;
  project?: number;
  assigned_to?: number;
  category?: string;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  tags?: string;
}
