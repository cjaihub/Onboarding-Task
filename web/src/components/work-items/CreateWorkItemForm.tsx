"use client"
import * as React from "react"
import { useCreateWorkItemMutation } from "../../hooks/mutations"
import { useProjectsQuery, useUsersQuery } from "../../hooks/queries"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Select } from "../ui/Select"
import { Priority, Status } from "../../types/api"
import { Spinner } from "../ui/Spinner"
import { FeedbackBanner } from "../ui/FeedbackBanner"

interface CreateWorkItemFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateWorkItemForm({ onSuccess, onCancel }: CreateWorkItemFormProps) {
  const mutation = useCreateWorkItemMutation()
  const { data: projects = [], isLoading: loadingProjects } = useProjectsQuery()
  const { data: users = [], isLoading: loadingUsers } = useUsersQuery()
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    
    const formData = new FormData(e.currentTarget)
    
    const assignedToVal = formData.get("assigned_to") as string
    
    const tagsVal = formData.get("tags") as string
    const tagsArray = tagsVal ? tagsVal.split(',').map(t => t.trim()).filter(Boolean) : []
    
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as Priority,
      project: parseInt(formData.get("project") as string, 10),
      category: formData.get("category") as string || "Feature",
      status: "OPEN" as Status, // explicit starting status
      assigned_to: assignedToVal ? parseInt(assignedToVal, 10) : null,
      tags: tagsArray
    }

    try {
      await mutation.mutateAsync(data)
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Failed to create work item.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
      {errorMsg && (
        <FeedbackBanner
          type="error"
          message={errorMsg}
          onDismiss={() => setErrorMsg(null)}
        />
      )}
      
      <div className="space-y-4 p-5 rounded-xl" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}>
        <div>
          <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>Title</label>
          <Input 
            id="title" 
            name="title" 
            required 
            placeholder="E.g. Implement login screen" 
            className="font-medium bg-white border-2 focus:border-red-600 focus:ring-4 focus:ring-red-600/10 transition-all shadow-sm h-11"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            className="flex w-full rounded-lg border-2 px-4 py-3 text-sm font-medium placeholder:text-gray-400 focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-600/10 transition-all shadow-sm"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
            placeholder="Provide context, acceptance criteria, and technical details..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-xl shadow-sm" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}>
        <div>
          <label htmlFor="project" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Project</label>
          <Select 
            id="project" 
            name="project" 
            required 
            defaultValue=""
            className="w-full font-medium h-11 border-2 focus:border-red-600 shadow-sm"
            disabled={loadingProjects}
          >
            <option value="" disabled>Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Priority</label>
          <Select 
            id="priority" 
            name="priority" 
            required 
            defaultValue="MEDIUM"
            className="w-full font-medium h-11 border-2 focus:border-red-600 shadow-sm"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </div>

        <div>
          <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Category</label>
          <Input 
            id="category" 
            name="category" 
            placeholder="e.g. Bug, Feature, Debt" 
            defaultValue="Feature"
            className="font-medium h-11 border-2 focus:border-red-600 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="assigned_to" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Assignee</label>
          <Select 
            id="assigned_to" 
            name="assigned_to" 
            defaultValue=""
            className="w-full font-medium h-11 border-2 focus:border-red-600 shadow-sm"
            disabled={loadingUsers}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="tags" className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Tags</label>
          <Input 
            id="tags" 
            name="tags" 
            placeholder="e.g. M-Pesa, Production, Payments (comma separated)" 
            className="font-medium h-11 border-2 focus:border-red-600 shadow-sm w-full"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="font-bold">
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={mutation.isPending}
          className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide shadow-md px-6"
        >
          {mutation.isPending ? <Spinner size="sm" className="mr-2 border-white/40 border-t-white" /> : null}
          Create Work Item
        </Button>
      </div>
    </form>
  )
}
