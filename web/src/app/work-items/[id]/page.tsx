import { Suspense } from "react"
import { WorkItemDetailView } from "../../../components/work-items/WorkItemDetailView"
import { Spinner } from "../../../components/ui/Spinner"

export default async function WorkItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  
  return (
    <Suspense fallback={<div className="flex h-[400px] items-center justify-center"><Spinner size="lg" /></div>}>
      <WorkItemDetailView id={id} />
    </Suspense>
  )
}
