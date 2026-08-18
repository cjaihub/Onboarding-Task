"use client"
import * as React from 'react'
import { WorkItem, User, Project, Status, Priority } from '../../types/api'
import { useUpdateWorkItemMutation } from '../../hooks/mutations'
import { Spinner } from '../ui/Spinner'
import { X, Save, AlertCircle } from 'lucide-react'

interface QuickEditModalProps {
  item: WorkItem | null
  users: User[]
  projects: Project[]
  onClose: () => void
  onSuccess: () => void
}

const STATUS_OPTIONS: Status[] = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'RESOLVED', 'CLOSED']
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function getAvatarColor(name: string): string {
  const colors = ['#ef4444','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#3b82f6','#10b981']
  return colors[name.charCodeAt(0) % colors.length]
}
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function QuickEditModal({ item, users, projects, onClose, onSuccess }: QuickEditModalProps) {
  const updateMutation = useUpdateWorkItemMutation()

  const [title, setTitle] = React.useState(item?.title ?? '')
  const [priority, setPriority] = React.useState<Priority>(item?.priority ?? 'MEDIUM')
  const [assignedTo, setAssignedTo] = React.useState<number | null>(item?.assigned_to ?? null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(item.title)
      setPriority(item.priority)
      setAssignedTo(item.assigned_to)
      setError(null)
    }
  }, [item])

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!item) return null

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return }
    setError(null)
    try {
      await updateMutation.mutateAsync({ id: item.id, data: { title: title.trim(), priority, assigned_to: assignedTo } })
      onSuccess()
      onClose()
    } catch (e) {
      setError((e as { message?: string }).message || 'Failed to update item.')
    }
  }

  const PRIORITY_COLORS: Record<Priority, string> = {
    LOW: '#22c55e', MEDIUM: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200"
        style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div>
            <h3 className="text-sm font-bold text-white">Quick Edit</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{item.reference_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all placeholder-gray-600"
              placeholder="Work item title..."
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all`}
                  style={{
                    background: priority === p ? `${PRIORITY_COLORS[p]}25` : 'rgba(255,255,255,0.04)',
                    color: priority === p ? PRIORITY_COLORS[p] : '#6b7280',
                    border: `1px solid ${priority === p ? PRIORITY_COLORS[p] + '60' : 'rgba(255,255,255,0.08)'}`,
                    transform: priority === p ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assignee</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAssignedTo(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: assignedTo === null ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                  color: assignedTo === null ? '#818cf8' : '#6b7280',
                  border: `1px solid ${assignedTo === null ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                Unassigned
              </button>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setAssignedTo(u.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: assignedTo === u.id ? `${getAvatarColor(u.username)}20` : 'rgba(255,255,255,0.04)',
                    color: assignedTo === u.id ? 'white' : '#6b7280',
                    border: `1px solid ${assignedTo === u.id ? getAvatarColor(u.username) + '50' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: getAvatarColor(u.username) }}>
                    {getInitials(u.username)}
                  </span>
                  {u.username}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)' }}
          >
            {updateMutation.isPending ? <Spinner size="sm" className="border-white/40 border-t-white" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
