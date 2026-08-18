"use client"
import * as React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Status, WorkItem, User } from '../../types/api'
import { KanbanCard } from './KanbanCard'
import { Plus, MoreHorizontal } from 'lucide-react'

const COLUMN_CONFIG: Record<Status, { color: string; glow: string; dotColor: string; emptyLabel: string }> = {
  OPEN:        { color: '#ef4444', glow: 'rgba(239,68,68,0.15)',  dotColor: '#ef4444', emptyLabel: 'No open items' },
  IN_PROGRESS: { color: '#f59e0b', glow: 'rgba(245,158,11,0.12)', dotColor: '#f59e0b', emptyLabel: 'Nothing in progress' },
  REVIEW:      { color: '#8b5cf6', glow: 'rgba(139,92,246,0.12)', dotColor: '#8b5cf6', emptyLabel: 'No items in review' },
  RESOLVED:    { color: '#10b981', glow: 'rgba(16,185,129,0.12)', dotColor: '#10b981', emptyLabel: 'Nothing resolved yet' },
  CLOSED:      { color: '#6b7280', glow: 'rgba(107,114,128,0.1)',  dotColor: '#6b7280', emptyLabel: 'No closed items' },
}

interface KanbanColumnProps {
  id: Status
  title: string
  items: WorkItem[]
  users: User[]
  mutatingItemId?: number
  onPreview: (id: number) => void
  onEdit: (item: WorkItem) => void
  onChat: (id: number) => void
  onAddItem: (status: Status) => void
}

export function KanbanColumn({ id, title, items, users, mutatingItemId, onPreview, onEdit, onChat, onAddItem }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'Column', status: id } })
  const cfg = COLUMN_CONFIG[id] ?? COLUMN_CONFIG.OPEN

  const criticalCount = items.filter(i => i.priority === 'CRITICAL').length
  const overdueCount = items.filter(i => i.due_date && new Date(i.due_date) < new Date() && i.status !== 'CLOSED' && i.status !== 'RESOLVED').length

  return (
    <div className="flex flex-col min-w-[300px] w-full max-w-[340px] shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 mb-3 pb-3" style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <div className="flex items-center gap-2">
          {/* Colored indicator dot */}
          <span className="relative flex h-2.5 w-2.5">
            {id === 'IN_PROGRESS' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: cfg.color }} />
            )}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: cfg.color }} />
          </span>
          <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
          {/* Item count badge */}
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{ background: `${cfg.color}20`, color: cfg.color }}
          >
            {items.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Stats micro-badges */}
          {criticalCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              {criticalCount} CRIT
            </span>
          )}
          {overdueCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              {overdueCount} OVR
            </span>
          )}
          <button
            onClick={() => onAddItem(id)}
            className="p-1 rounded-lg transition-all hover:scale-110"
            style={{ color: cfg.color, background: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.background = `${cfg.color}18`)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title="Add item"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button className="p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-4 p-3 rounded-2xl min-h-[500px] transition-all duration-200"
        style={{
          background: isOver ? cfg.glow : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isOver ? cfg.color + '50' : 'rgba(255,255,255,0.04)'}`,
          boxShadow: isOver ? `0 0 20px ${cfg.color}15 inset` : 'none',
        }}
      >
        <SortableContext items={items.map(i => i.id.toString())} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <KanbanCard
              key={item.id}
              item={item}
              users={users}
              isMutating={item.id === mutatingItemId}
              onPreview={onPreview}
              onEdit={onEdit}
              onChat={onChat}
            />
          ))}
        </SortableContext>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${cfg.color}15`, border: `1px dashed ${cfg.color}40` }}>
              <Plus className="w-5 h-5" style={{ color: cfg.color, opacity: 0.6 }} />
            </div>
            <p className="text-xs text-gray-600 italic">{cfg.emptyLabel}</p>
          </div>
        )}

        {/* Add Task Shortcut at bottom */}
        <button
          onClick={() => onAddItem(id)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all opacity-0 hover:opacity-100 group-hover:opacity-60 text-gray-600 hover:text-gray-300"
          style={{ border: '1px dashed rgba(255,255,255,0.08)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${cfg.color}40`; e.currentTarget.style.color = cfg.color }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#4b5563' }}
        >
          <Plus className="w-3.5 h-3.5" /> Add task
        </button>
      </div>
    </div>
  )
}
