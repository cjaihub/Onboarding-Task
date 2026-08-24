"use client"
import * as React from "react"
import { downloadFile } from "../../lib/api-client"
import { useWorkItemQuery, useCommentsQuery, useActivityQuery, useUsersQuery, useProjectsQuery } from "../../hooks/queries"
import { useTransitionWorkItemMutation, useUpdateWorkItemMutation, useAssignWorkItemMutation, useUpdateCommentMutation, useDeleteCommentMutation } from "../../hooks/mutations"
import { Status, Comment, Activity } from "../../types/api"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Spinner } from "../ui/Spinner"
import { ErrorState } from "../ui/ErrorState"
import { FeedbackBanner, useFeedback } from "../ui/FeedbackBanner"
import { CommentForm } from "./CommentForm"
import {
  Clock, CheckCircle2, FileText, Calendar, AlertCircle,
  RefreshCw, Briefcase, ChevronRight, PlayCircle, Eye, Inbox, Network, Camera, Download, Edit2, Trash2
} from "lucide-react"
import Link from "next/link"
import { CaptureModal } from '../collaboration/CaptureModal'
import { VisualFeedbackPanel } from '../collaboration/VisualFeedbackPanel'
import Image from "next/image"

function getInitials(name: string) {
  if (!name) return "?"
  return name.substring(0, 2).toUpperCase()
}

// Inline resolution note form — shown in-page when user clicks Resolve
function ResolutionNoteForm({
  onConfirm,
  onCancel,
  isPending,
  backendError,
}: {
  onConfirm: (note: string) => void
  onCancel: () => void
  isPending: boolean
  backendError: string | null
}) {
  const [note, setNote] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const isValid = note.trim().length > 0

  // Shift focus to textarea when form appears
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  React.useEffect(() => { textareaRef.current?.focus() }, [])

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Resolve work item"
      className="animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl p-5 shadow-md space-y-4"
      style={{ background: 'var(--surface-card)', border: '2px solid var(--brand)' }}
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Resolve Work Item</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            A resolution note is required by policy — describe how this was addressed.
          </p>
        </div>
      </div>

      {/* Backend error shown inside the form */}
      {backendError && (
        <FeedbackBanner type="error" message={backendError} persistent />
      )}

      <div>
        <label htmlFor="resolution-note" className="sr-only">Resolution note (required)</label>
        <textarea
          id="resolution-note"
          ref={textareaRef}
          rows={4}
          value={note}
          onChange={(e) => { setNote(e.target.value); setTouched(true) }}
          placeholder="Describe how this was resolved, what changed, and any follow-up actions..."
          aria-required="true"
          aria-describedby={touched && !isValid ? "resolution-note-error" : undefined}
          className="w-full rounded-lg border-2 px-4 py-3 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 transition-all"
          style={{
            background: 'var(--surface-raised)',
            borderColor: touched && !isValid ? '#ef4444' : 'var(--border-default)',
            color: 'var(--text-primary)',
            boxShadow: touched && !isValid ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
          }}
        />
        {touched && !isValid && (
          <p id="resolution-note-error" role="alert" className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden="true" /> Resolution note is required to resolve this item.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
          className="font-bold"
        >
          Cancel
        </Button>
        <Button
          onClick={() => { setTouched(true); if (isValid) onConfirm(note) }}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm"
        >
          {isPending && <Spinner size="sm" className="mr-2 border-white/40 border-t-white" />}
          Confirm Resolution
        </Button>
      </div>
    </div>
  )
}

export function WorkItemDetailView({ id }: { id: number }) {
  const { data: item, isLoading, error } = useWorkItemQuery(id)
  const { data: commentsResponse } = useCommentsQuery(id)
  const { data: activitiesResponse } = useActivityQuery(id)
  const { data: users = [], isLoading: loadingUsers } = useUsersQuery()
  const { data: projects = [] } = useProjectsQuery()

  const transitionMutation = useTransitionWorkItemMutation()
  const updateMutation = useUpdateWorkItemMutation()
  const assignMutation = useAssignWorkItemMutation()

  // Shared feedback state via hook (auto-dismisses success after 4s)
  const { banner, showError, showSuccess, clear } = useFeedback()
  const [assigning, setAssigning] = React.useState(false)
  const [showResolutionForm, setShowResolutionForm] = React.useState(false)
  const [resolutionBackendError, setResolutionBackendError] = React.useState<string | null>(null)
  const [showCaptureModal, setShowCaptureModal] = React.useState(false)
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null)
  const [editMessage, setEditMessage] = React.useState('')
  const currentUserId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('userId') || '0', 10) : 0

  const updateCommentMutation = useUpdateCommentMutation()
  const deleteCommentMutation = useDeleteCommentMutation()
  
  // Mobile specific states
  const [activeTab, setActiveTab] = React.useState<"overview" | "discussion" | "workflows">("overview")
  const [isActionSheetOpen, setIsActionSheetOpen] = React.useState(false)

  if (isLoading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>
  if (error || !item) return (
    <div className="p-8">
      <ErrorState title="Work Item not found" message="This item may have been deleted or you don't have permission to view it." />
    </div>
  )

  // Properly handle paginated responses from nested endpoints
  const commentsData = commentsResponse as { results?: Comment[] } | Comment[]
  const comments = (Array.isArray(commentsData) ? commentsData : commentsData?.results) || item.comments || []

  const activitiesData = activitiesResponse as { results?: Activity[] } | Activity[]
  const activities = (Array.isArray(activitiesData) ? activitiesData : activitiesData?.results) || item.activities || []

  // Merged chronological timeline (oldest first for chat UI)
  const timelineEvents = [
    ...comments.map(c => ({ type: "comment" as const, date: new Date(c.created_at), data: c })),
    ...activities.map(a => ({ type: "activity" as const, date: new Date(a.timestamp), data: a })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  const handleStatusChange = async (newStatus: Status) => {
    if (newStatus === "RESOLVED") {
      setResolutionBackendError(null)
      setShowResolutionForm(true)
      return
    }
    clear()
    try {
      await transitionMutation.mutateAsync({ id, status: newStatus })
      showSuccess(`Status updated to ${newStatus.replace("_", " ")}.`)
    } catch (err) {
      const msg = (err as { message?: string })?.message || "An unexpected error occurred."
      showError(`Transition failed: ${msg}`)
    }
  }

  const handleResolveConfirm = async (resolutionNote: string) => {
    setResolutionBackendError(null)
    try {
      await transitionMutation.mutateAsync({ id, status: "RESOLVED", resolutionNote })
      setShowResolutionForm(false)
      showSuccess("Work item resolved successfully.")
    } catch (err) {
      const msg = (err as { message?: string })?.message || "An unexpected error occurred."
      // Show backend error inside the resolution form, not outside
      setResolutionBackendError(msg)
    }
  }

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const assigned_to = val ? parseInt(val, 10) : null
    
    if (!assigned_to) {
      showError("Unassigning is not supported by the assign endpoint.");
      return;
    }

    setAssigning(true)
    clear()
    try {
      await assignMutation.mutateAsync({ id, userId: assigned_to })
      showSuccess("Assignee updated.")
    } catch (err) {
      const msg = (err as { message?: string })?.message || "An unexpected error occurred."
      showError(`Failed to update assignee: ${msg}`)
    } finally {
      setAssigning(false)
    }
  }

  const isOverdue =
    item.due_date &&
    new Date(item.due_date) < new Date() &&
    item.status !== "CLOSED" &&
    item.status !== "RESOLVED"

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Global inline feedback banner ── */}
      {banner && (
        <FeedbackBanner
          type={banner.type}
          message={banner.message}
          onDismiss={clear}
        />
      )}

      {/* ── Inline resolution form ── shown above header when resolving */}
      {showResolutionForm && (
        <ResolutionNoteForm
          onConfirm={handleResolveConfirm}
          onCancel={() => { setShowResolutionForm(false); setResolutionBackendError(null) }}
          isPending={transitionMutation.isPending}
          backendError={resolutionBackendError}
        />
      )}

      {/* ── HEADER ── */}
      <div
        className="rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400" />

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 text-sm">
            <span
              className="font-bold px-2.5 py-1 rounded-md tracking-wide"
              style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
            >
              {item.reference_number || `WORK-${item.id}`}
            </span>
            <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <span className="font-medium flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Briefcase className="h-3.5 w-3.5" aria-hidden="true" /> {projects.find(p => p.id === item.project)?.name || `Project ${item.project}`}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={item.status === "CLOSED" ? "default" : item.status === "RESOLVED" ? "success" : "outline"}
              className="px-3 py-1 text-sm shadow-sm font-semibold tracking-wide"
            >
              {item.status.replace("_", " ")}
            </Badge>
            <Badge
              variant={item.priority === "CRITICAL" ? "danger" : item.priority === "HIGH" ? "warning" : "outline"}
              className="px-3 py-1 text-sm shadow-sm font-semibold tracking-wide"
            >
              {item.priority} Priority
            </Badge>
            {item.category && (
              <span
                className="inline-flex items-center rounded-md px-3 py-1 text-sm font-bold text-white shadow-sm tracking-wide"
                style={{ background: 'var(--text-primary)' }}
              >
                {item.category}
              </span>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3 ml-1 dark:border-gray-700">
                {item.tags.map(t => (
                  <Badge key={t} variant="outline" className="px-2 py-0.5 text-xs font-medium tracking-wide bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── WORKFLOW ACTIONS (Desktop) ── */}
        <div className="hidden md:flex flex-col gap-3 w-full md:w-auto md:min-w-[200px] mt-2 md:mt-0">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            Workflow Actions
          </h3>

          {item.status !== "IN_PROGRESS" && item.status !== "RESOLVED" && item.status !== "CLOSED" && (
            <Button
              onClick={() => handleStatusChange("IN_PROGRESS")}
              disabled={transitionMutation.isPending || showResolutionForm}
              className="w-full justify-center font-bold shadow-md"
              style={{ background: 'var(--text-primary)', color: 'var(--surface-card)' }}
            >
              <PlayCircle className="mr-2 h-4 w-4" /> Start Work
            </Button>
          )}

          {item.status !== "REVIEW" && item.status !== "RESOLVED" && item.status !== "CLOSED" && (
            <Button
              onClick={() => handleStatusChange("REVIEW")}
              disabled={transitionMutation.isPending || showResolutionForm}
              className="w-full justify-center font-bold shadow-md"
              style={{ background: 'var(--text-primary)', color: 'var(--surface-card)' }}
            >
              <Eye className="mr-2 h-4 w-4" /> Move to Review
            </Button>
          )}

          {item.status !== "RESOLVED" && item.status !== "CLOSED" && (
            <Button
              onClick={() => handleStatusChange("RESOLVED")}
              disabled={transitionMutation.isPending || showResolutionForm}
              className="w-full justify-center bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve
            </Button>
          )}

          {item.status === "RESOLVED" && (
            <Button
              onClick={() => handleStatusChange("CLOSED")}
              disabled={transitionMutation.isPending}
              variant="outline"
              className="w-full justify-center font-bold"
            >
              <Inbox className="mr-2 h-4 w-4" /> Close
            </Button>
          )}

          {item.status === "CLOSED" && (
            <div
              className="text-sm font-bold text-center uppercase tracking-wider py-2 rounded-md"
              style={{ color: 'var(--text-muted)', background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
            >
              Item is Closed
            </div>
          )}

          {transitionMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              <Spinner size="sm" /> Updating...
            </div>
          )}

          {/* Visual Feedback Button */}
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => setShowCaptureModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)' }}
            >
              <Camera className="h-3.5 w-3.5" /> Visual Feedback
            </button>
          </div>
        </div>
        
        {/* ── MOBILE ACTIONS CTA ── */}
        <div className="md:hidden mt-4">
           <Button onClick={() => setIsActionSheetOpen(true)} className="w-full bg-red-600 text-white font-bold py-3 shadow-md">
             Actions & Workflow
           </Button>
        </div>
      </div>

      {/* ── MOBILE TABS ── */}
      <div className="lg:hidden flex border-b mt-2 mb-4 overflow-x-auto hide-scrollbar" style={{ borderColor: 'var(--border-subtle)' }}>
        <button onClick={() => setActiveTab('overview')} className={`flex-1 min-w-[100px] py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Overview</button>
        <button onClick={() => setActiveTab('discussion')} className={`flex-1 min-w-[100px] py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'discussion' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Discussion</button>
        <button onClick={() => setActiveTab('workflows')} className={`flex-1 min-w-[100px] py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'workflows' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Workflows</button>
      </div>

      {/* ── BODY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-10">

        {/* MAIN COLUMN */}
        <div className={`lg:col-span-3 space-y-8 ${activeTab === 'discussion' ? 'block' : 'hidden lg:block'}`}>

          {/* Description */}
          <section
            className="rounded-xl shadow-sm overflow-hidden"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="border-b px-6 py-4 bg-[#0f1115]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" aria-hidden="true" /> Description
              </h2>
            </div>
            <div className="p-6">
              <div
                className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {item.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided.</span>}
              </div>
            </div>
          </section>

          {/* Resolution (if resolved) */}
          {item.resolution_note && (
            <section className="bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-900 shadow-sm overflow-hidden">
              <div className="border-b border-green-200/50 bg-green-100/50 dark:bg-green-900/20 px-6 py-4">
                <h2 className="text-sm font-bold text-green-900 dark:text-green-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" /> Resolution
                </h2>
              </div>
              <div className="p-6">
                <div className="text-green-800 dark:text-green-200 font-medium leading-relaxed whitespace-pre-wrap text-sm">
                  {item.resolution_note}
                </div>
              </div>
            </section>
          )}

          {/* Discussion & Timeline (Chat UI) */}
          <section
            className="rounded-xl shadow-sm overflow-hidden flex flex-col"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', height: '700px' }}
          >
            <div className="px-6 py-4 bg-[#0f1115] flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Discussion & Timeline</span>
                <span className="text-xs font-medium text-gray-500">{timelineEvents.length} events</span>
              </h2>
            </div>

            {/* Scrollable History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" id="chat-history">
              {timelineEvents.length === 0 && (
                <div
                  className="text-center py-12 rounded-xl border border-dashed"
                  style={{ background: 'var(--surface-raised)', borderColor: 'var(--border-default)' }}
                >
                  <p className="font-bold uppercase tracking-wider text-sm" style={{ color: 'var(--text-muted)' }}>
                    No activity or comments yet
                  </p>
                </div>
              )}

              {timelineEvents.map((event) => {
                if (event.type === "comment") {
                  const c = event.data as Comment
                  const isImage = c.attachment && /\.(jpg|jpeg|png|gif|webp)$/i.test(c.attachment);
                  return (
                    <div key={`comment-${c.id}`} className="flex gap-4 items-end group">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white font-bold text-sm shadow-sm flex-shrink-0">
                        {getInitials(c.author_name || `U${c.author}`)}
                      </div>
                      <div
                        className="max-w-[85%] rounded-2xl rounded-bl-sm p-4 shadow-sm"
                        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {c.author_name || `User ${c.author}`}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                              {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {c.author === currentUserId && editingCommentId !== c.id && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setEditingCommentId(c.id); setEditMessage(c.message); }}
                                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                title="Edit comment"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-white" />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this comment?')) {
                                    try {
                                      await deleteCommentMutation.mutateAsync(c.id);
                                      showSuccess('Comment deleted');
                                    } catch (e) {
                                      showError('Failed to delete comment');
                                    }
                                  }
                                }}
                                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                        {editingCommentId === c.id ? (
                          <div className="mt-2">
                            <textarea
                              className="w-full rounded-md border-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-red-500 focus:ring-red-500/20"
                              style={{ background: 'var(--surface-base)', borderColor: 'var(--border-subtle)', color: 'white' }}
                              value={editMessage}
                              onChange={(e) => setEditMessage(e.target.value)}
                              rows={3}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                              <Button 
                                size="sm" 
                                className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm"
                                disabled={updateCommentMutation.isPending}
                                onClick={async () => {
                                  if (!editMessage.trim()) return;
                                  try {
                                    await updateCommentMutation.mutateAsync({ commentId: c.id, message: editMessage });
                                    setEditingCommentId(null);
                                    showSuccess('Comment updated');
                                  } catch(e) {
                                    showError('Failed to update comment');
                                  }
                                }}
                              >
                                {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {c.message}
                          </p>
                        )}
                        {c.attachment && (
                          <div className="mt-3">
                            {isImage ? (
                              <div className="relative w-64 max-w-full rounded-lg overflow-hidden group/image border border-border-subtle bg-surface-base shadow-sm">
                                {/* Use standard img instead of next/image for better compatibility with proxy/external URLs */}
                                <img 
                                  src={c.attachment} 
                                  alt="Attached visual" 
                                  className="w-full h-auto object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity" 
                                  onClick={() => window.open(c.attachment as string, '_blank')}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                                    (e.target as HTMLImageElement).style.padding = '2rem';
                                    (e.target as HTMLImageElement).style.opacity = '0.5';
                                  }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    downloadFile(c.attachment!, c.attachment!.split('/').pop() || 'download');
                                  }}
                                  className="absolute bottom-2 right-2 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md opacity-0 group-hover/image:opacity-100 transition-all shadow-lg hover:scale-105 active:scale-95"
                                  style={{ background: 'rgba(0,0,0,0.75)', color: 'white', backdropFilter: 'blur(4px)' }}
                                >
                                  <Download className="h-3.5 w-3.5" /> Download
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  downloadFile(c.attachment!, c.attachment!.split('/').pop() || 'download');
                                }}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-black/20 transition-colors w-full text-left"
                                style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-base)' }}
                              >
                                <FileText className="h-6 w-6 text-red-500 shrink-0" />
                                <div className="overflow-hidden flex-1">
                                  <p className="text-sm font-bold text-white truncate">{c.attachment.split('/').pop()}</p>
                                  <p className="text-xs text-gray-500 font-medium uppercase">Click to download</p>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                } else {
                  const a = event.data as Activity
                  return (
                    <div key={`activity-${a.id}`} className="flex justify-center my-4">
                      <div
                        className="text-xs font-medium inline-flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm"
                        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
                      >
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-bold text-white">{a.actor_name || "System"}</span>{" "}
                          <span>{a.activity_type.toLowerCase().replace(/_/g, " ")}</span>{" "}
                          {a.field_changed && (
                            <span>
                              <span className="font-bold text-white">{a.field_changed}</span> from{" "}
                              <span className="line-through text-gray-500">{a.old_value}</span> to{" "}
                              <span className="font-bold text-red-400">{a.new_value}</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                }
              })}
            </div>

            {/* Fixed Chat Input */}
            <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'var(--surface-card)' }}>
              <CommentForm 
                workItemId={id} 
                onTriggerVisualFeedback={() => setShowCaptureModal(true)} 
              />
            </div>
          </section>
        </div>

        {/* ── SIDE PANEL ── */}
        <div className={`space-y-6 lg:col-span-1 ${activeTab === 'overview' || activeTab === 'workflows' ? 'block' : 'hidden lg:block'}`}>
          <section
            className={`rounded-xl shadow-sm overflow-hidden ${activeTab === 'overview' ? 'block' : 'hidden lg:block'}`}
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="px-6 py-4 bg-[#0f1115]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Details</h2>
            </div>
            <div className="p-6">
              <dl className="space-y-5">

                {/* Assignee */}
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                    Assignee
                    {assigning && <RefreshCw className="h-3 w-3 animate-spin" style={{ color: 'var(--text-muted)' }} aria-label="Saving assignee..." />}
                  </dt>
                  <dd>
                    <select
                      value={item.assigned_to || ""}
                      onChange={handleAssigneeChange}
                      disabled={assigning || loadingUsers}
                      aria-label="Assignee"
                      className="w-full text-sm font-bold rounded-md border-2 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      style={{
                        background: 'var(--surface-raised)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                      ))}
                    </select>
                  </dd>
                </div>

                {/* Priority */}
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</dt>
                  <dd>
                    <Badge variant={item.priority === "CRITICAL" ? "danger" : item.priority === "HIGH" ? "warning" : "outline"} className="font-bold">
                      {item.priority}
                    </Badge>
                  </dd>
                </div>

                {/* Status */}
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</dt>
                  <dd className="text-sm font-extrabold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    {item.status.replace("_", " ")}
                  </dd>
                </div>

                {/* Due Date */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <dt className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Due Date</dt>
                  <dd className={`text-sm font-bold flex items-center gap-2 ${isOverdue ? "text-red-500" : ""}`} style={!isOverdue ? { color: 'var(--text-primary)' } : {}}>
                    <Calendar className="h-4 w-4" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                    {item.due_date ? new Date(item.due_date).toLocaleDateString() : "No due date"}
                  </dd>
                </div>

                {/* Overdue warning */}
                {isOverdue && (
                  <FeedbackBanner
                    type="error"
                    message="This item is overdue and requires immediate attention."
                    persistent
                  />
                )}

                {/* Timestamps */}
                <div className="space-y-3" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Created</dt>
                    <dd className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{new Date(item.created_at).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Updated</dt>
                    <dd className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{new Date(item.updated_at).toLocaleString()}</dd>
                  </div>
                </div>

              </dl>
            </div>
          </section>

          {/* Workflows Integration */}
          <section
            className={`rounded-xl shadow-sm overflow-hidden ${activeTab === 'workflows' ? 'block' : 'hidden lg:block'}`}
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="px-6 py-4 bg-[#0f1115]" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Network className="w-4 h-4 text-red-400" /> Workflow Automations
              </h2>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                This item is monitored by active engineering workflows. Automated rules and triggers are applied based on status changes.
              </p>
              <Link href="/workflows">
                <Button variant="outline" className="w-full text-xs font-bold border-gray-700 hover:bg-gray-800">
                  Manage Workflows
                </Button>
              </Link>
            </div>
          </section>
        </div>

      </div>

      {/* ── MOBILE ACTION SHEET ── */}
      {isActionSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsActionSheetOpen(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-[var(--surface-base)] rounded-t-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-[env(safe-area-inset-bottom)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Work Item Actions</h3>
              <button onClick={() => setIsActionSheetOpen(false)} className="text-gray-500 font-semibold text-sm">Close</button>
            </div>
            
            <div className="p-4 grid gap-3">
              {item.status !== "IN_PROGRESS" && item.status !== "RESOLVED" && item.status !== "CLOSED" && (
                <button
                  onClick={() => { handleStatusChange("IN_PROGRESS"); setIsActionSheetOpen(false); }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold active:bg-gray-800"
                >
                  <PlayCircle className="h-5 w-5 text-red-500" /> Start Work
                </button>
              )}

              {item.status !== "REVIEW" && item.status !== "RESOLVED" && item.status !== "CLOSED" && (
                <button
                  onClick={() => { handleStatusChange("REVIEW"); setIsActionSheetOpen(false); }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold active:bg-gray-800"
                >
                  <Eye className="h-5 w-5 text-purple-500" /> Move to Review
                </button>
              )}

              {item.status !== "RESOLVED" && item.status !== "CLOSED" && (
                <button
                  onClick={() => { handleStatusChange("RESOLVED"); setIsActionSheetOpen(false); }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-red-600 text-white font-bold active:bg-red-700"
                >
                  <CheckCircle2 className="h-5 w-5" /> Resolve
                </button>
              )}

              {item.status === "RESOLVED" && (
                <button
                  onClick={() => { handleStatusChange("CLOSED"); setIsActionSheetOpen(false); }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold active:bg-gray-800"
                >
                  <Inbox className="h-5 w-5" /> Close Item
                </button>
              )}

              {item.status === "CLOSED" && (
                <div className="text-center p-4 text-[var(--text-muted)] font-bold text-sm">
                  Item is Closed
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CAPTURE MODAL ── */}
      {showCaptureModal && (
        <CaptureModal
          projectId={item.project}
          workItemId={item.id}
          onClose={() => setShowCaptureModal(false)}
          onCaptureLinked={() => {
            setShowCaptureModal(false)
            showSuccess('Visual feedback attached successfully.')
          }}
        />
      )}
    </div>
  )
}

