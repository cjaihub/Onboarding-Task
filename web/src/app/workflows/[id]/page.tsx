import { WorkflowCanvas } from '@/components/workflows/WorkflowCanvas';

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <WorkflowCanvas workflowId={parseInt(resolvedParams.id, 10)} />;
}
