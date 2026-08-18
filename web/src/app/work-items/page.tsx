import { Suspense } from "react"
import { WorkItemsView } from "../../components/work-items/WorkItemsView"
import { Spinner } from "../../components/ui/Spinner"

export default function WorkItemsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    }>
      <WorkItemsView />
    </Suspense>
  )
}
