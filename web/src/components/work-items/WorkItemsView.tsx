"use client"
import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useWorkItemsQuery } from "../../hooks/queries"
import { Status, Priority } from "../../types/api"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Select } from "../ui/Select"
import { Badge } from "../ui/Badge"
import { Spinner } from "../ui/Spinner"
import { ErrorState } from "../ui/ErrorState"
import { EmptyState } from "../ui/EmptyState"
import { Modal } from "../ui/Modal"
import { CreateWorkItemForm } from "./CreateWorkItemForm"
import { Plus, Search, Filter, ChevronLeft, ChevronRight, AlertCircle, X, ArrowUpDown } from "lucide-react"

export function WorkItemsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false)

  // Extract filters from URL
  const page = parseInt(searchParams.get("page") || "1", 10)
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const priority = searchParams.get("priority") || ""
  const category = searchParams.get("category") || ""
  const project = searchParams.get("project") || ""
  const assigned_to = searchParams.get("assigned_to") || ""
  const tags = searchParams.get("tags") || ""
  const ordering = searchParams.get("ordering") || "-updated_at"

  const { data, isLoading, error, refetch } = useWorkItemsQuery({
    page,
    search: search || undefined,
    status: (status as Status) || undefined,
    priority: (priority as Priority) || undefined,
    category: category || undefined,
    project: project ? parseInt(project, 10) : undefined,
    assigned_to: assigned_to ? parseInt(assigned_to, 10) : undefined,
    tags: tags || undefined,
    ordering
  })

  // Local state for filter inputs
  const [localSearch, setLocalSearch] = React.useState(search)
  const [localCategory, setLocalCategory] = React.useState(category)
  const [localProject, setLocalProject] = React.useState(project)
  const [localAssignee, setLocalAssignee] = React.useState(assigned_to)
  const [localTags, setLocalTags] = React.useState(tags)

  const activeFilterCount = [search, status, priority, category, project, assigned_to, tags].filter(Boolean).length

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== "page") {
      params.delete("page") // Reset to page 1 on filter change
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleApplyTextFilters = () => {
    const params = new URLSearchParams(searchParams)
    if (localSearch) params.set("search", localSearch)
    else params.delete("search")
    
    if (localCategory) params.set("category", localCategory)
    else params.delete("category")

    if (localProject) params.set("project", localProject)
    else params.delete("project")

    if (localAssignee) params.set("assigned_to", localAssignee)
    else params.delete("assigned_to")

    if (localTags) params.set("tags", localTags)
    else params.delete("tags")

    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyTextFilters()
    }
  }

  const clearFilters = () => {
    setLocalSearch("")
    setLocalCategory("")
    setLocalProject("")
    setLocalAssignee("")
    setLocalTags("")
    router.push(pathname)
  }

  const handleSort = (field: string) => {
    const isDesc = ordering === `-${field}`
    const newOrdering = isDesc ? field : `-${field}`
    handleFilterChange("ordering", newOrdering)
  }

  const getSortIcon = (field: string) => {
    if (ordering === field) return <ArrowUpDown className="h-3 w-3 ml-1 text-red-400" />
    if (ordering === `-${field}`) return <ArrowUpDown className="h-3 w-3 ml-1 text-red-400 rotate-180" />
    return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
  }

  const isOverdue = (dateString?: string | null) => {
    if (!dateString) return false
    const due = new Date(dateString)
    const now = new Date()
    return due < now
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Work Tasks</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage and track all work tasks across projects.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="md:hidden gap-2 text-gray-700 bg-white" 
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <Filter className="h-4 w-4" />
            <span className="relative">
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-3 flex h-3 w-3 items-center justify-center rounded-full bg-red-600 text-[8px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-red-600 hover:bg-red-700 text-white p-2 sm:px-4">
            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">New Work Item</span>
          </Button>
        </div>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:block p-5 rounded-xl space-y-4 shadow-sm" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 xl:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search reference, title..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          
          {/* Dropdowns */}
          <div className="flex flex-wrap gap-3 flex-1">
            <Select 
              value={status} 
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-36"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>

            <Select 
              value={priority} 
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="w-36"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>

            <Input 
              placeholder="Category" 
              value={localCategory}
              onChange={(e) => setLocalCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-32"
            />
            
            <Input 
              placeholder="Project ID" 
              value={localProject}
              onChange={(e) => setLocalProject(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-32"
            />

            <Input 
              placeholder="Assignee ID" 
              value={localAssignee}
              onChange={(e) => setLocalAssignee(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-32"
            />
            
            <Input 
              placeholder="Tag (e.g. M-Pesa)" 
              value={localTags}
              onChange={(e) => setLocalTags(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-32"
            />

            <Button variant="secondary" onClick={handleApplyTextFilters}>
              Apply
            </Button>
            
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearFilters} className="text-gray-500 hover:text-red-600 hover:border-red-200">
                <X className="h-4 w-4 mr-1" />
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="rounded-xl shadow-sm overflow-hidden min-h-[400px]" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState 
              title="Failed to load work items" 
              message="There was an issue fetching the data from the server." 
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          </div>
        ) : data?.results.length === 0 ? (
          <EmptyState 
            title="No work items match your current filters." 
            message="Try adjusting or clearing your filters to see more results."
            icon={<Filter className="h-12 w-12 text-gray-400 mb-4" />}
            action={{
              label: "Clear Filters",
              onClick: clearFilters
            }}
          />
        ) : (
          <div className="">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#0f1115]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Tags</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider group cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => handleSort('priority')}>
                      <div className="flex items-center">Priority {getSortIcon('priority')}</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Assignee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider group cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => handleSort('due_date')}>
                      <div className="flex items-center">Due Date {getSortIcon('due_date')}</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider group cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => handleSort('updated_at')}>
                      <div className="flex items-center">Updated {getSortIcon('updated_at')}</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}>
                  {data?.results.map((item) => (
                    <tr key={item.id} className="hover:bg-red-50/20 dark:hover:bg-red-900/10 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                        <Link href={`/work-items/${item.id}`} className="group-hover:text-red-600 transition-colors" style={{ color: 'var(--text-primary)' }}>
                          {item.reference_number || 'UNASSIGNED'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[200px] xl:max-w-[250px] truncate" style={{ color: 'var(--text-secondary)' }}>
                        <Link href={`/work-items/${item.id}`} className="hover:text-red-500 transition-colors" title={item.title} style={{ color: 'inherit' }}>
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Project {item.project}
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {item.category || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.tags && item.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map(t => (
                              <Badge key={t} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">{t}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Badge variant={item.priority === 'CRITICAL' ? 'danger' : item.priority === 'HIGH' ? 'warning' : 'outline'}>
                          {item.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Badge variant={item.status === 'CLOSED' ? 'default' : item.status === 'RESOLVED' ? 'success' : 'outline'}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {item.assigned_to ? `User ${item.assigned_to}` : <span className="italic" style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                    </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${isOverdue(item.due_date) && item.status !== 'CLOSED' && item.status !== 'RESOLVED' ? 'text-red-500 flex items-center gap-1' : ''}`} style={!(isOverdue(item.due_date) && item.status !== 'CLOSED' && item.status !== 'RESOLVED') ? { color: 'var(--text-secondary)' } : {}}>
                        {isOverdue(item.due_date) && item.status !== 'CLOSED' && item.status !== 'RESOLVED' && <AlertCircle className="h-3 w-3" />}
                        {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {data?.results.map(item => (
                <div key={item.id} className="p-4 space-y-3 transition-colors" style={{ background: 'var(--surface-card)' }}>
                  <div className="flex justify-between items-start">
                    <Link href={`/work-items/${item.id}`} className="text-sm font-bold hover:text-red-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {item.reference_number || 'UNASSIGNED'}
                    </Link>
                    <Badge variant={item.status === 'CLOSED' ? 'default' : item.status === 'RESOLVED' ? 'success' : 'outline'}>
                        {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Link href={`/work-items/${item.id}`} className="block text-sm mt-1 font-medium hover:text-red-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                    {item.title}
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={item.priority === 'CRITICAL' ? 'danger' : item.priority === 'HIGH' ? 'warning' : 'outline'}>
                        {item.priority}
                    </Badge>
                    <span className="text-xs px-2 py-1 rounded-md" style={{ color: 'var(--text-muted)', background: 'var(--surface-raised)' }}>Project {item.project}</span>
                    {item.category && <span className="text-xs px-2 py-1 rounded-md" style={{ color: 'var(--text-muted)', background: 'var(--surface-raised)' }}>{item.category}</span>}
                  </div>
                  <div className="flex justify-between items-center text-xs pt-3 mt-2" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <span className="truncate max-w-[120px]">
                      {item.assigned_to ? `User ${item.assigned_to}` : 'Unassigned'}
                    </span>
                    <span className={isOverdue(item.due_date) && item.status !== 'CLOSED' && item.status !== 'RESOLVED' ? 'text-red-500 font-medium flex items-center gap-1' : ''}>
                      {isOverdue(item.due_date) && item.status !== 'CLOSED' && item.status !== 'RESOLVED' && <AlertCircle className="h-3 w-3" />}
                      Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Pagination Controls */}
        {data && (data.next || data.previous) && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-raised)' }}>
            <div className="flex flex-1 justify-between sm:hidden">
              <Button 
                variant="outline" 
                disabled={!data.previous}
                onClick={() => handleFilterChange("page", String(page - 1))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                disabled={!data.next}
                onClick={() => handleFilterChange("page", String(page + 1))}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-semibold text-gray-900">{page}</span>
                  {data.count && <span> of <span className="font-semibold text-gray-900">{Math.ceil(data.count / 12)}</span> pages ({data.count} items)</span>}
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm bg-white" aria-label="Pagination">
                  <Button 
                    variant="outline" 
                    className="rounded-r-none hover:bg-gray-50 focus:z-10 text-gray-500"
                    disabled={!data.previous}
                    onClick={() => handleFilterChange("page", String(page - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  
                  {data.count && (() => {
                    const totalPages = Math.ceil(data.count / 12);
                    let startPage = Math.max(1, page - 2);
                    const endPage = Math.min(totalPages, startPage + 4);
                    if (endPage - startPage < 4) {
                      startPage = Math.max(1, endPage - 4);
                    }
                    
                    const buttons = [];
                    for (let i = startPage; i <= endPage; i++) {
                      buttons.push(
                        <Button
                          key={i}
                          variant="outline"
                          className={`rounded-none hover:bg-gray-50 focus:z-10 px-4 ${page === i ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 relative z-10' : 'text-gray-500'}`}
                          onClick={() => handleFilterChange("page", String(i))}
                        >
                          {i}
                        </Button>
                      );
                    }
                    return buttons;
                  })()}

                  <Button 
                    variant="outline" 
                    className="rounded-l-none hover:bg-gray-50 focus:z-10 text-gray-500"
                    disabled={!data.next}
                    onClick={() => handleFilterChange("page", String(page + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Work Item">
        <CreateWorkItemForm 
          onCancel={() => setIsModalOpen(false)} 
          onSuccess={() => setIsModalOpen(false)} 
        />
      </Modal>

      {/* Mobile Filter Bottom Sheet */}
      {isMobileFilterOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsMobileFilterOpen(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-[var(--surface-base)] rounded-t-2xl border-t border-[var(--border-subtle)] overflow-y-auto max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom-full duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-[var(--surface-base)] p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Filters</h3>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Done
              </button>
            </div>
            
            <div className="p-4 space-y-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search reference, title..." 
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9 w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                <Select 
                  value={status} 
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Priority</label>
                <Select 
                  value={priority} 
                  onChange={(e) => handleFilterChange("priority", e.target.value)}
                  className="w-full"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
                <Input 
                  placeholder="Category" 
                  value={localCategory}
                  onChange={(e) => setLocalCategory(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Project ID</label>
                  <Input 
                    placeholder="Project ID" 
                    value={localProject}
                    onChange={(e) => setLocalProject(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Assignee ID</label>
                  <Input 
                    placeholder="Assignee ID" 
                    value={localAssignee}
                    onChange={(e) => setLocalAssignee(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Tags</label>
                <Input 
                  placeholder="Tag (e.g. M-Pesa)" 
                  value={localTags}
                  onChange={(e) => setLocalTags(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
                  onClick={() => {
                    handleApplyTextFilters();
                    setIsMobileFilterOpen(false);
                  }}
                >
                  Apply Filters
                </Button>
                {activeFilterCount > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="text-gray-500">
                    Clear ({activeFilterCount})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
