"use client"
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { 
  DndContext, DragOverlay, closestCorners,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent, DragOverEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { QuickPreviewModal } from './QuickPreviewModal'
import { QuickEditModal } from './QuickEditModal'
import { Status, WorkItem, User, Priority } from '../../types/api'
import { useWorkItemsQuery, useUsersQuery, useProjectsQuery, useDashboardQuery } from '../../hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import { useTransitionWorkItemMutation } from '../../hooks/mutations'
import { Spinner } from '../ui/Spinner'
import { ErrorState } from '../ui/ErrorState'
import { FeedbackBanner } from '../ui/FeedbackBanner'
import { Modal } from '../ui/Modal'
import { CreateWorkItemForm } from '../work-items/CreateWorkItemForm'
import { 
  AlertTriangle, Clock, Activity, Zap, 
  RefreshCw, Filter, Search, LayoutGrid, 
  Plus, ChevronDown, Users, Tag as TagIcon
} from 'lucide-react'

const COLUMNS: { id: Status; title: string }[] = [
  { id: 'OPEN',        title: 'Open'        },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW',      title: 'Review'      },
  { id: 'RESOLVED',    title: 'Resolved'    },
]

function StatCard({ icon, label, value, color, sub, onClick, isActive }: {
  icon: React.ReactNode; label: string; value: number; color: string; sub?: string;
  onClick?: () => void; isActive?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${onClick ? 'cursor-pointer hover:bg-white/5 active:scale-95' : 'cursor-default'} ${isActive ? 'ring-2 ring-red-500/50 bg-red-500/10' : ''}`}
      style={{ background: isActive ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}
      onClick={onClick}
    >
      <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xl font-bold text-white leading-none">{value}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] font-semibold mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const router = useRouter()
  const { data: users = [] } = useUsersQuery()
  const { data: projects = [] } = useProjectsQuery()
  const { data: dashboardData } = useDashboardQuery()
  const { mutateAsync: transitionItem } = useTransitionWorkItemMutation()

  const [activeId, setActiveId] = React.useState<number | null>(null)
  const [mutatingItemId, setMutatingItemId] = React.useState<number | null>(null)
  const [boardError, setBoardError] = React.useState<string | null>(null)
  const [activeMobileColumn, setActiveMobileColumn] = React.useState<Status>('OPEN')
  const queryClient = useQueryClient()

  // Feature state
  const [previewId, setPreviewId] = React.useState<number | null>(null)
  const [editingItem, setEditingItem] = React.useState<WorkItem | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [createForStatus, setCreateForStatus] = React.useState<Status>('OPEN')
  const [boardSearch, setBoardSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [boardFilter, setBoardFilter] = React.useState<{ assignee?: number; category?: string; priority?: Priority; status?: Status }>({})
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [showFilters, setShowFilters] = React.useState(false)

  const { data, isLoading, error, refetch } = useWorkItemsQuery({ 
    page_size: 200, 
    search: debouncedSearch || undefined,
    ...boardFilter
  })

  // Real-time Sync state
  const [isLive, setIsLive] = React.useState(false)

  React.useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws/'
    const ws = new WebSocket(`${wsUrl}board/`)
    
    ws.onopen = () => setIsLive(true)
    ws.onclose = () => setIsLive(false)
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type) {
          queryClient.invalidateQueries({ queryKey: ['workItems'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        }
      } catch(e) {}
    }
    return () => ws.close()
  }, [queryClient])

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(boardSearch), 300)
    return () => clearTimeout(timer)
  }, [boardSearch])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const allItems = React.useMemo(() => {
    if (!data?.results) return []
    return data.results.filter(item => COLUMNS.some(col => col.id === item.status))
  }, [data])

  // Filtered items
  const items = React.useMemo(() => {
    return allItems.filter(item => {
      if (boardSearch) {
        const q = boardSearch.toLowerCase()
        if (!item.title.toLowerCase().includes(q) && !(item.reference_number ?? '').toLowerCase().includes(q)) return false
      }
      if (boardFilter.assignee && item.assigned_to !== boardFilter.assignee) return false
      if (boardFilter.category && item.category !== boardFilter.category) return false
      return true
    })
  }, [allItems, boardSearch, boardFilter])

  // Stats
  const stats = React.useMemo(() => {
    if (dashboardData) {
      return {
        active: dashboardData.open + dashboardData.in_progress,
        critical: dashboardData.critical,
        overdue: dashboardData.overdue,
        inReview: dashboardData.review,
      }
    }
    const now = new Date()
    return {
      active: allItems.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length,
      critical: allItems.filter(i => i.priority === 'CRITICAL').length,
      overdue: allItems.filter(i => i.due_date && new Date(i.due_date) < now && i.status !== 'CLOSED' && i.status !== 'RESOLVED').length,
      inReview: allItems.filter(i => i.status === 'REVIEW').length,
    }
  }, [allItems, dashboardData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const handleAddItem = (status: Status) => {
    setCreateForStatus(status)
    setIsCreateModalOpen(true)
  }

  const handleChat = (id: number) => {
    router.push(`/work-items/${id}#comments`)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(parseInt(event.active.id as string, 10))
    setBoardError(null)
  }

  const handleDragOver = (_event: DragOverEvent) => { /* optimistic moves handled in drag end */ }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeItemId = parseInt(active.id as string, 10)
    const activeItem = items.find(i => i.id === activeItemId)
    if (!activeItem) return

    let targetStatus: Status | null = null
    if (COLUMNS.some(col => col.id === over.id)) {
      targetStatus = over.id as Status
    } else {
      const overItem = items.find(i => i.id.toString() === over.id)
      if (overItem) targetStatus = overItem.status
    }

    if (!targetStatus || targetStatus === activeItem.status) return

    setMutatingItemId(activeItemId)
    try {
      await transitionItem({ id: activeItemId, status: targetStatus })
    } catch (error) {
      setBoardError((error as Error).message || 'Failed to move item. The transition may not be allowed.')
    } finally {
      setMutatingItemId(null)
    }
  }

  const getItemsForColumn = (status: Status) => items.filter(i => i.status === status)
  const activeItem = activeId ? items.find(i => i.id === activeId) : null

  if (isLoading) return (
    <div className="flex h-[500px] items-center justify-center">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">Loading engineering board…</p>
      </div>
    </div>
  )

  if (error) return <ErrorState title="Failed to load board" message="Could not fetch work items." actionLabel="Retry" onAction={refetch} />

  return (
    <div className="flex flex-col h-full gap-4 -mt-2">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--surface-raised)] p-4 rounded-2xl border border-[var(--border-subtle)]">
        <div>
          <h1 
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Engineering Board
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Real-time incident &amp; work tracker · drag to transition · hover cards for quick actions
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors" 
            style={{ 
              background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', 
              color: isLive ? '#10b981' : '#f59e0b', 
              border: `1px solid ${isLive ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` 
            }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isLive ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* ── Engineering Stats Header ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard 
          icon={<Activity className="w-4 h-4" />} label="Active Items" value={stats.active} color="#ef4444" 
          isActive={boardFilter.status === 'OPEN' || boardFilter.status === 'IN_PROGRESS'}
          onClick={() => setBoardFilter(f => (f.status === 'OPEN' ? {} : { ...f, status: 'OPEN' }))}
        />
        <StatCard 
          icon={<Zap className="w-4 h-4" />} label="Critical" value={stats.critical} color="#ef4444" sub={stats.critical > 0 ? "Needs attention" : undefined} 
          isActive={boardFilter.priority === 'CRITICAL'}
          onClick={() => setBoardFilter(f => (f.priority === 'CRITICAL' ? { ...f, priority: undefined } : { ...f, priority: 'CRITICAL' }))}
        />
        <StatCard 
          icon={<Clock className="w-4 h-4" />} label="Overdue" value={stats.overdue} color="#f59e0b" sub={stats.overdue > 0 ? "Past due date" : undefined} 
        />
        <StatCard 
          icon={<AlertTriangle className="w-4 h-4" />} label="In Review" value={stats.inReview} color="#8b5cf6" 
          isActive={boardFilter.status === 'REVIEW'}
          onClick={() => setBoardFilter(f => (f.status === 'REVIEW' ? { ...f, status: undefined } : { ...f, status: 'REVIEW' }))}
        />
      </div>

      {boardError && (
        <FeedbackBanner type="error" message={boardError} onDismiss={() => setBoardError(null)} />
      )}

      {/* ── Board Toolbar ── */}
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            value={boardSearch}
            onChange={e => setBoardSearch(e.target.value)}
            placeholder="Search board…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-gray-200 placeholder-gray-600 bg-white/5 border border-white/8 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all`}
            style={{
              background: showFilters ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
              color: showFilters ? '#f87171' : '#6b7280',
              border: `1px solid ${showFilters ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {Object.keys(boardFilter).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#ef4444', color: 'white' }}>
                {Object.keys(boardFilter).length}
              </span>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-300 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="h-5 w-px bg-white/10 hidden sm:block" />

          {/* Board item count */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-gray-500"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{items.length} items</span>
          </div>

          {/* Add task button */}
          <button
            onClick={() => handleAddItem('OPEN')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
          >
            <Plus className="w-3.5 h-3.5" /> New Item
          </button>
        </div>
      </div>

      {/* ── Filter Expand Panel ── */}
      {showFilters && (
        <div 
          className="flex flex-wrap gap-3 px-4 py-3 rounded-2xl animate-in slide-in-from-top-2 duration-200"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Assignee filter */}
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            <select
              className="text-xs bg-white/5 text-gray-300 border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-500/60"
              value={boardFilter.assignee ?? ''}
              onChange={e => setBoardFilter(f => ({ ...f, assignee: e.target.value ? parseInt(e.target.value) : undefined }))}
            >
              <option value="">All Assignees</option>
              {(users as User[]).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <TagIcon className="w-3.5 h-3.5 text-gray-500" />
            <select
              className="text-xs bg-white/5 text-gray-300 border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-500/60"
              value={boardFilter.category || ''}
              onChange={e => setBoardFilter(f => ({ ...f, category: e.target.value || undefined }))}
            >
              <option value="">All Categories</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="infrastructure">Infra</option>
            </select>
          </div>

          {Object.keys(boardFilter).length > 0 && (
            <button
              onClick={() => setBoardFilter({})}
              className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Mobile Column Switcher ── */}
      <div className="md:hidden flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
        {COLUMNS.map(col => (
          <button
            key={col.id}
            onClick={() => setActiveMobileColumn(col.id)}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: activeMobileColumn === col.id ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeMobileColumn === col.id ? '#f87171' : '#6b7280',
              border: `1px solid ${activeMobileColumn === col.id ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {col.title} ({getItemsForColumn(col.id).length})
          </button>
        ))}
      </div>

      {/* ── Kanban Columns ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 -mx-1 px-1 snap-x md:snap-none" style={{ minHeight: '520px' }}>
          {COLUMNS.map(col => (
            <div
              key={col.id}
              className={`w-full shrink-0 snap-center ${activeMobileColumn === col.id ? 'block' : 'hidden md:flex'}`}
            >
              <KanbanColumn
                id={col.id}
                title={col.title}
                items={getItemsForColumn(col.id)}
                users={users as User[]}
                mutatingItemId={mutatingItemId ?? undefined}
                onPreview={setPreviewId}
                onEdit={setEditingItem}
                onChat={handleChat}
                onAddItem={handleAddItem}
              />
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
          {activeItem ? (
            <KanbanCard
              item={activeItem}
              users={users as User[]}
              onPreview={() => {}}
              onEdit={() => {}}
              onChat={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Modals ── */}
      <QuickPreviewModal
        itemId={previewId}
        users={users as User[]}
        projects={projects}
        onClose={() => setPreviewId(null)}
        onOpenFull={id => router.push(`/work-items/${id}`)}
        onChat={handleChat}
      />

      <QuickEditModal
        item={editingItem}
        users={users as User[]}
        projects={projects}
        onClose={() => setEditingItem(null)}
        onSuccess={() => {}}
      />

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="New Work Item">
        <CreateWorkItemForm onSuccess={() => setIsCreateModalOpen(false)} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  )
}
