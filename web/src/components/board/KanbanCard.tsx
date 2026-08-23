"use client"
import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { WorkItem, User, Project } from '../../types/api'
import { 
  AlertCircle, MessageSquare, Clock, Tag, Folder,
  Eye, Pencil, Mail, GitPullRequest, Loader2, GripVertical
} from 'lucide-react'

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = ['#ef4444','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#3b82f6','#10b981']
  return colors[name.charCodeAt(0) % colors.length]
}

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   label: 'CRIT' },
  HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.15)',  label: 'HIGH' },
  MEDIUM:   { color: '#eab308', bg: 'rgba(234,179,8,0.15)',   label: 'MED'  },
  LOW:      { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   label: 'LOW'  },
}

interface KanbanCardProps {
  item: WorkItem
  users: User[]
  projects?: Project[]
  isMutating?: boolean
  onPreview: (id: number) => void
  onEdit: (item: WorkItem) => void
  onChat: (id: number) => void
}

export function KanbanCard({ item, users, projects = [], isMutating = false, onPreview, onEdit, onChat }: KanbanCardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({
    id: item.id.toString(),
    data: { type: 'WorkItem', item },
    disabled: isMutating,
  })

  const [showActions, setShowActions] = React.useState(false)

  const style = { transform: CSS.Transform.toString(transform), transition }

  const assignee = users.find(u => u.id === item.assigned_to)
  const project = projects.find(p => p.id === item.project)
  const priority = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.MEDIUM
  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'CLOSED' && item.status !== 'RESOLVED'
  const commentCount = item.comments?.length ?? 0
  const dueDateStr = item.due_date ? new Date(item.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, background: 'rgba(99,102,241,0.1)' }}
        className="rounded-xl h-28 opacity-40 border-2 border-dashed border-red-400"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Main Card */}
      <div
        className={cn(
          "relative rounded-xl p-4 transition-all duration-200 cursor-default select-none",
          isMutating ? "opacity-60" : "hover:translate-y-[-2px] hover:shadow-xl hover:shadow-black/30"
        )}
        style={{
          background: 'linear-gradient(145deg, #161b22, #0d1117)',
          border: `1px solid ${showActions ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: showActions ? '0 0 0 1px rgba(99,102,241,0.2), 0 8px 32px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {/* Loading overlay */}
        {isMutating && (
          <div className="absolute inset-0 z-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(13,17,23,0.7)', backdropFilter: 'blur(2px)' }}>
            <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
          </div>
        )}

        {/* Left status accent bar */}
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: priority.color }} />

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 hover:!opacity-80 cursor-grab active:cursor-grabbing transition-opacity p-1"
        >
          <GripVertical className="w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Header row: ref + priority */}
        <div className="flex items-center justify-between mb-3 pr-5">
          <span className="text-[10px] font-bold font-mono tracking-wider" style={{ color: 'rgba(129,140,248,0.8)' }}>
            {item.reference_number || `#${item.id}`}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: priority.bg, color: priority.color }}
          >
            {priority.label}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold leading-snug mb-3 line-clamp-2 text-white/90 pr-2">
          {item.title}
        </h4>

        {/* Tags & Project */}
        <div className="flex flex-wrap gap-1 mb-3">
          {project && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Folder className="w-2.5 h-2.5" />
              <span className="truncate max-w-[100px]">{project.name}</span>
            </span>
          )}
          {item.tags && item.tags.slice(0, 3).map(t => (
            <span key={t} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Tag className="w-2 h-2" />{t}
            </span>
          ))}
          {item.tags && item.tags.length > 3 && (
            <span className="text-[10px] text-gray-500">+{item.tags.length - 3}</span>
          )}
        </div>

        {/* Footer row: avatar, date, comments */}
        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Assignee avatar */}
          <div className="flex items-center gap-1.5">
            {assignee ? (
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ring-1 ring-black/50 overflow-hidden"
                style={{ background: getAvatarColor(assignee.username) }}
                title={assignee.username}>
                {assignee.profile?.avatar_url ? (
                  <img src={assignee.profile.avatar_url} alt={assignee.username} className="w-full h-full object-cover" />
                ) : (
                  getInitials(assignee.username)
                )}
              </span>
            ) : (
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ring-1 ring-white/10"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-gray-600 text-[8px]">?</span>
              </span>
            )}
            <span className="text-[10px] text-gray-500 truncate max-w-[60px]">
              {assignee?.username ?? 'None'}
            </span>
          </div>

          {/* Right stats */}
          <div className="flex items-center gap-2.5">
            {commentCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <MessageSquare className="w-3 h-3" />{commentCount}
              </span>
            )}
            {dueDateStr && (
              <span className={cn(
                "flex items-center gap-1 text-[10px] font-medium",
                isOverdue ? "text-red-400" : "text-gray-500"
              )}>
                {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {dueDateStr}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar — appears on hover */}
      <div className={cn(
        "absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full flex items-center gap-1 px-2 py-1.5 rounded-xl z-20 transition-all duration-200",
        showActions ? "opacity-100 translate-y-[calc(100%+2px)]" : "opacity-0 translate-y-full pointer-events-none"
      )}
        style={{ background: '#1c2333', border: '1px solid rgba(99,102,241,0.4)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
        <ActionButton icon={<Eye className="w-3.5 h-3.5" />} label="Preview" color="#818cf8" onClick={() => onPreview(item.id)} />
        <ActionButton icon={<MessageSquare className="w-3.5 h-3.5" />} label="Chat" color="#34d399" onClick={() => onChat(item.id)} />
        <ActionButton icon={<Pencil className="w-3.5 h-3.5" />} label="Edit" color="#f59e0b" onClick={() => onEdit(item)} />
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        {assignee?.email && (
          <ActionButton icon={<Mail className="w-3.5 h-3.5" />} label="Connect" color="#ec4899"
            onClick={() => window.open(`mailto:${assignee.email}?subject=${encodeURIComponent(`Re: ${item.reference_number} - ${item.title}`)}`)} />
        )}
        <ActionButton icon={<GitPullRequest className="w-3.5 h-3.5" />} label="Request" color="#a78bfa"
          onClick={() => onChat(item.id)} />
      </div>
    </div>
  )
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={label}
      className="group/btn flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-110 active:scale-95"
      style={{ color: 'rgba(156,163,175,0.8)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = color; (e.currentTarget as HTMLElement).style.background = `${color}18` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(156,163,175,0.8)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {icon}
      <span className="text-[10px] font-semibold hidden group-hover/btn:inline">{label}</span>
    </button>
  )
}
