"use client"
import * as React from 'react'
import { WorkItem, User, Project } from '../../types/api'
import { useWorkItemQuery } from '../../hooks/queries'
import { Spinner } from '../ui/Spinner'
import { Badge } from '../ui/Badge'
import { 
  X, ExternalLink, MessageSquare, Clock, AlertCircle, 
  User as UserIcon, Briefcase, Tag, CalendarDays, 
  CheckCircle2, Circle
} from 'lucide-react'

interface QuickPreviewModalProps {
  itemId: number | null
  users: User[]
  projects: Project[]
  onClose: () => void
  onOpenFull: (id: number) => void
  onChat: (id: number) => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN:        { label: 'Open',        color: '#ef4444', icon: <Circle className="w-3 h-3" /> },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', icon: <Clock className="w-3 h-3" /> },
  REVIEW:      { label: 'Review',      color: '#8b5cf6', icon: <CheckCircle2 className="w-3 h-3" /> },
  RESOLVED:    { label: 'Resolved',    color: '#10b981', icon: <CheckCircle2 className="w-3 h-3" /> },
  CLOSED:      { label: 'Closed',      color: '#6b7280', icon: <CheckCircle2 className="w-3 h-3" /> },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: 'Critical', color: '#ef4444' },
  HIGH:     { label: 'High',     color: '#f97316' },
  MEDIUM:   { label: 'Medium',   color: '#eab308' },
  LOW:      { label: 'Low',      color: '#22c55e' },
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = ['#ef4444','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#3b82f6','#10b981']
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function QuickPreviewModal({ itemId, users, projects, onClose, onOpenFull, onChat }: QuickPreviewModalProps) {
  const { data: item, isLoading } = useWorkItemQuery(itemId ?? 0)
  
  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!itemId) return null

  const assignee = item ? users.find(u => u.id === item.assigned_to) : null
  const project = item ? projects.find(p => p.id === item.project) : null
  const statusConfig = item ? STATUS_CONFIG[item.status] : null
  const priorityConfig = item ? PRIORITY_CONFIG[item.priority] : null
  const isOverdue = item?.due_date && new Date(item.due_date) < new Date() && item.status !== 'CLOSED' && item.status !== 'RESOLVED'

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      
      {/* Slide-over panel */}
      <div 
        className="relative w-full max-w-lg h-full flex flex-col shadow-2xl animate-in slide-in-from-right-8 duration-300"
        style={{ background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
              PREVIEW
            </span>
            {item && (
              <span className="text-xs font-mono text-gray-400">{item.reference_number}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {item && (
              <>
                <button
                  onClick={() => onChat(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:scale-105"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <MessageSquare className="w-3 h-3" />
                  Chat
                </button>
                <button
                  onClick={() => onOpenFull(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:scale-105"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Full
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Spinner /></div>
          ) : item ? (
            <>
              {/* Title & Status */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold leading-snug text-white">{item.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {statusConfig && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: `${statusConfig.color}20`, color: statusConfig.color, border: `1px solid ${statusConfig.color}40` }}>
                      {statusConfig.icon}{statusConfig.label}
                    </span>
                  )}
                  {priorityConfig && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: `${priorityConfig.color}20`, color: priorityConfig.color, border: `1px solid ${priorityConfig.color}40` }}>
                      {priorityConfig.label}
                    </span>
                  )}
                  {item.tags?.map(t => (
                    <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                      <Tag className="w-2.5 h-2.5" />{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Assignee</p>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: getAvatarColor(assignee.username) }}>
                        {getInitials(assignee.username)}
                      </span>
                      <span className="text-sm text-gray-200 font-medium">{assignee.username}</span>
                    </div>
                  ) : <p className="text-sm text-gray-500">Unassigned</p>}
                </div>
                <div className="p-3 rounded-lg space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Project</p>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-200 font-medium truncate">{project?.name || `Project ${item.project}`}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Due Date</p>
                  <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-gray-200'}`}>
                    {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <CalendarDays className="w-3.5 h-3.5 text-gray-400" />}
                    <span className="text-sm font-medium">
                      {item.due_date ? new Date(item.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Category</p>
                  <span className="text-sm text-gray-200 font-medium">{item.category || '—'}</span>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Description</p>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                </div>
              )}

              {/* Recent Comments */}
              {item.comments && item.comments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Recent Comments ({item.comments.length})</p>
                  <div className="space-y-2">
                    {item.comments.slice(-3).map(c => (
                      <div key={c.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs font-semibold text-gray-400 mb-1">{c.author_name}</p>
                        <p className="text-sm text-gray-300 line-clamp-2">{c.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-center py-10">Item not found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
