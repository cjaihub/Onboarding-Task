"use client"
import { EmptyState } from "../../components/ui/EmptyState"
import { BarChart3 } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex h-[80vh] items-center justify-center animate-in fade-in duration-500">
      <EmptyState
        title="Analytics & Reports"
        message="Advanced engineering analytics and data exports are currently under development."
        icon={<BarChart3 className="h-12 w-12 text-gray-400 mb-4" />}
      />
    </div>
  )
}
