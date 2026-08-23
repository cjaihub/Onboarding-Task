"use client"
import { EmptyState } from "../../components/ui/EmptyState"
import { CheckSquare } from "lucide-react"

export default function MyWorkPage() {
  return (
    <div className="flex h-[80vh] items-center justify-center animate-in fade-in duration-500">
      <EmptyState
        title="My Work"
        message="A dedicated view for your assigned tasks is currently under development. Please use the main Work Tasks list in the meantime."
        icon={<CheckSquare className="h-12 w-12 text-gray-400 mb-4" />}
      />
    </div>
  )
}
