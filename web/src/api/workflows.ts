import { Workflow, WorkflowExecution, WorkflowExecutionStep } from '@/types/workflow';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function getWorkflows(search?: string): Promise<Workflow[]> {
  const url = search ? `${API_BASE}/workflows/?search=${encodeURIComponent(search)}` : `${API_BASE}/workflows/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch workflows');
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function getWorkflow(id: number): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/workflows/${id}/`);
  if (!res.ok) throw new Error('Failed to fetch workflow');
  return res.json();
}

export async function createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/workflows/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  return res.json();
}

export async function updateWorkflow(id: number, data: Partial<Workflow>): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/workflows/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update workflow');
  return res.json();
}

export async function activateWorkflow(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/workflows/${id}/activate/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to activate workflow');
}

export async function deactivateWorkflow(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/workflows/${id}/deactivate/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to deactivate workflow');
}

export async function executeWorkflow(id: number): Promise<{ status: string, execution_id: number }> {
  const res = await fetch(`${API_BASE}/workflows/${id}/execute/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to execute workflow');
  return res.json();
}

export async function getWorkflowExecutions(workflowId: number): Promise<WorkflowExecution[]> {
  const res = await fetch(`${API_BASE}/workflow-executions/?workflow=${workflowId}`);
  if (!res.ok) throw new Error('Failed to fetch executions');
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function getWorkflowExecutionSteps(executionId: number): Promise<WorkflowExecutionStep[]> {
  const res = await fetch(`${API_BASE}/workflow-execution-steps/?execution=${executionId}`);
  if (!res.ok) throw new Error('Failed to fetch execution steps');
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}
