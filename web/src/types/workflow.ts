export interface Workflow {
  id: number;
  name: string;
  description: string;
  project?: number | null;
  is_active: boolean;
  definition: Record<string, unknown>; // React Flow json
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: number;
  workflow: number;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  trigger_data: Record<string, unknown>;
  started_at: string;
  completed_at?: string | null;
  steps?: WorkflowExecutionStep[];
}

export interface WorkflowExecutionStep {
  id: number;
  execution: number;
  node_id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  started_at: string;
  completed_at?: string | null;
  logs: string;
  error: string;
}
