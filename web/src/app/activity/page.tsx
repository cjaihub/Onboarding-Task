"use client"
import { EmptyState } from "../../components/ui/EmptyState"
import { Activity } from "lucide-react"

export default function ActivityPage() {
  return (
    <div className="flex h-[80vh] items-center justify-center animate-in fade-in duration-500">
      <EmptyState
        title="Global Activity Feed"
        message="The full chronological activity feed for all engineering operations is currently under development."
        icon={<Activity className="h-12 w-12 text-gray-400 mb-4" />}
      />
    </div>
  )
}
