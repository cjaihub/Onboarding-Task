"use client"
import { EmptyState } from "../../components/ui/EmptyState"
import { Calendar } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="flex h-[80vh] items-center justify-center animate-in fade-in duration-500">
      <EmptyState
        title="Calendar View Coming Soon"
        message="The calendar scheduling and timeline view is currently under development. Check back later for updates."
        icon={<Calendar className="h-12 w-12 text-gray-400 mb-4" />}
      />
    </div>
  )
}
