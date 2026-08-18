"use client"
import * as React from "react"
import { KanbanBoard } from "../../components/board/KanbanBoard"

export default function BoardPage() {
  return (
    <div className="h-full flex flex-col space-y-5">
      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  )
}
