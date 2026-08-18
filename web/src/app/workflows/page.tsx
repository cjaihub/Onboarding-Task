'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkflows, createWorkflow, activateWorkflow, deactivateWorkflow } from '@/api/workflows';
import Link from 'next/link';
import { Play, Square, Settings, Plus, Network } from 'lucide-react';
import { Workflow } from '@/types/workflow';

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => getWorkflows(),
  });

  const createMutation = useMutation({
    mutationFn: () => createWorkflow({ name: 'New Workflow', description: 'Describe your workflow' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });

  const toggleStatus = useMutation({
    mutationFn: (workflow: Workflow) => workflow.is_active ? deactivateWorkflow(workflow.id) : activateWorkflow(workflow.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });

  const workflowList = workflows || [];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Network className="w-8 h-8 text-red-500" /> Workflow Studio</h1>
          <p className="text-gray-500 mt-1">Automate your engineering operations with visual node-based workflows.</p>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Workflow
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-zinc-800 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4">
          {workflowList.map((workflow: Workflow) => (
            <div key={workflow.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 sm:p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <Link href={`/workflows/${workflow.id}`} className="text-xl font-semibold hover:text-red-500 transition-colors">
                  {workflow.name}
                </Link>
                <p className="text-gray-500 text-sm">{workflow.description}</p>
                <div className="text-xs text-gray-400 mt-2">
                  Last updated {new Date(workflow.updated_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-zinc-800">
                <button
                  onClick={() => toggleStatus.mutate(workflow)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    workflow.is_active 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300'
                  }`}
                >
                  {workflow.is_active ? (
                    <><Play className="w-4 h-4" /> Active</>
                  ) : (
                    <><Square className="w-4 h-4" /> Inactive</>
                  )}
                </button>
                <Link
                  href={`/workflows/${workflow.id}`}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
          {workflowList.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
              <Network className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No workflows yet</h3>
              <p className="text-gray-500 mt-1">Get started by creating your first workflow.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
