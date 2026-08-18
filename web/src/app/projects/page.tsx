"use client"
import { EmptyState } from "../../components/ui/EmptyState"
import { FolderKanban } from "lucide-react"

export default function ProjectsPage() {
  return (
    <div className="flex h-[80vh] items-center justify-center animate-in fade-in duration-500">
      <EmptyState
        title="Project Portfolios"
        message="Project management and portfolio overviews are currently under development."
        icon={<FolderKanban className="h-12 w-12 text-gray-400 mb-4" />}
      />
    </div>
  )
}
