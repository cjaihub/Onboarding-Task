"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/api-client'
import { User, Project } from '../../types/api'
import { Check, ChevronRight, ChevronLeft, Shield, Users, Target, Bell, Settings, Plus, X } from 'lucide-react'

// --- Types ---
type WizardState = {
  name: string
  description: string
  projectType: string
  techTools: string[]
  members: number[]
  tasks: { title: string; priority: string; assignedTo?: number }[]
  notificationsEnabled: boolean
}

const STEPS = [
  { id: 1, title: 'Project Identity', icon: <Settings className="w-5 h-5" /> },
  { id: 2, title: 'Team Assembly', icon: <Users className="w-5 h-5" /> },
  { id: 3, title: 'Task Scoping', icon: <Target className="w-5 h-5" /> },
  { id: 4, title: 'Audit & Rules', icon: <Bell className="w-5 h-5" /> },
  { id: 5, title: 'Review & Launch', icon: <Shield className="w-5 h-5" /> }
]

export function ProjectSetupWizard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [state, setState] = useState<WizardState>({
    name: '',
    description: '',
    projectType: 'FULLSTACK',
    techTools: [],
    members: [],
    tasks: [
      { title: 'Initial Architecture Review', priority: 'HIGH' },
      { title: 'Setup CI/CD Pipeline', priority: 'HIGH' }
    ],
    notificationsEnabled: true
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient<User[]>('/users/')
  })
  
  const { data: metadata, isLoading: metadataLoading } = useQuery({
    queryKey: ['metadata'],
    queryFn: () => apiClient<{ project_types: { value: string, label: string }[], tech_tools: { value: string, label: string }[] }>('/metadata/')
  })

  const handleNext = () => setStep(s => Math.min(s + 1, 5))
  const handlePrev = () => setStep(s => Math.max(s - 1, 1))

  const handleLaunch = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      // 1. Create Project
      const project = await apiClient<Project>('/projects/', {
        method: 'POST',
        body: JSON.stringify({
          name: state.name,
          description: state.description,
          project_type: state.projectType,
          tech_tools: state.techTools,
          members: state.members
        })
      })

      // 2. Create Tasks
      if (state.tasks.length > 0) {
        await Promise.all(state.tasks.map(task => 
          apiClient('/work-items/', {
            method: 'POST',
            body: JSON.stringify({
              title: task.title,
              description: 'Auto-generated during project setup.',
              project: project.id,
              priority: task.priority,
              category: 'ENGINEERING',
              status: 'OPEN',
              assigned_to: task.assignedTo || null
            })
          })
        ))
      }

      // Success!
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['workItems'] })
      router.push(`/projects/${project.id}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to create project')
      setIsSubmitting(false)
    }
  }

  // --- Step Components ---
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Project Name</label>
        <input 
          autoFocus
          className="w-full bg-[#1e2128] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
          placeholder="e.g., Project Phoenix"
          value={state.name}
          onChange={e => setState({ ...state, name: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
        <textarea 
          rows={3}
          className="w-full bg-[#1e2128] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
          placeholder="What is the objective of this project?"
          value={state.description}
          onChange={e => setState({ ...state, description: e.target.value })}
        />
      </div>

      {!metadataLoading && metadata && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Project Type</label>
            <select 
              className="w-full bg-[#1e2128] border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-red-500 appearance-none"
              value={state.projectType}
              onChange={e => setState({ ...state, projectType: e.target.value })}
            >
              {metadata.project_types.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tech Stack / Tools</label>
            <div className="flex flex-wrap gap-2">
              {metadata.tech_tools.map(tool => {
                const isSelected = state.techTools.includes(tool.value);
                return (
                  <button
                    key={tool.value}
                    type="button"
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        techTools: isSelected 
                          ? prev.techTools.filter(t => t !== tool.value)
                          : [...prev.techTools, tool.value]
                      }))
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isSelected 
                        ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                        : 'bg-[#1e2128] text-gray-400 border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    {tool.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep2 = () => {
    const toggleUser = (userId: number) => {
      setState(prev => ({
        ...prev,
        members: prev.members.includes(userId) 
          ? prev.members.filter(id => id !== userId)
          : [...prev.members, userId]
      }))
    }

    return (
      <div className="space-y-4">
        <p className="text-gray-400 mb-6">Select the inter-team members who will have access to this project. Tasks can only be assigned to members of this roster.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map(user => {
            const isSelected = state.members.includes(user.id)
            return (
              <div 
                key={user.id} 
                onClick={() => toggleUser(user.id)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected ? 'bg-red-500/10 border-red-500' : 'bg-[#1e2128] border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-300">
                    {user.first_name?.[0] || user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-gray-500">@{user.username}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-red-500" />}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderStep3 = () => (
    <div className="space-y-6">
      <p className="text-gray-400">Define the initial backlog of tasks required to bootstrap this project.</p>
      
      <div className="space-y-3">
        {state.tasks.map((task, idx) => (
          <div key={idx} className="flex gap-3 items-center bg-[#1e2128] p-3 rounded-lg border border-gray-800">
            <input 
              className="flex-1 bg-transparent border-none text-white focus:outline-none"
              value={task.title}
              onChange={e => {
                const newTasks = [...state.tasks]
                newTasks[idx].title = e.target.value
                setState({ ...state, tasks: newTasks })
              }}
            />
            <select 
              className="bg-[#0f1115] border border-gray-800 rounded px-2 py-1 text-sm text-gray-300 focus:outline-none focus:border-red-500"
              value={task.priority}
              onChange={e => {
                const newTasks = [...state.tasks]
                newTasks[idx].priority = e.target.value
                setState({ ...state, tasks: newTasks })
              }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <button 
              onClick={() => {
                const newTasks = state.tasks.filter((_, i) => i !== idx)
                setState({ ...state, tasks: newTasks })
              }}
              className="text-gray-500 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={() => setState({ ...state, tasks: [...state.tasks, { title: 'New Task', priority: 'MEDIUM' }] })}
        className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium text-sm transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Task
      </button>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-[#1e2128] p-5 rounded-xl border border-gray-800 flex gap-4 items-start">
        <div className="p-3 bg-red-500/10 rounded-lg text-red-500 shrink-0">
          <Bell className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1">Automated Team Notifications</h3>
          <p className="text-sm text-gray-400 mb-4">
            When enabled, the system will automatically dispatch alerts to project members when tasks are assigned, resolved, or marked as CRITICAL priority.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-12 h-6 rounded-full transition-colors relative ${state.notificationsEnabled ? 'bg-red-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${state.notificationsEnabled ? 'left-7' : 'left-1'}`} />
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={state.notificationsEnabled}
              onChange={e => setState({ ...state, notificationsEnabled: e.target.checked })} 
            />
            <span className="text-gray-300 font-medium">Enable Rules</span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#1e2128] to-[#15171c] p-6 rounded-xl border border-gray-800">
        <h3 className="text-2xl font-bold text-white mb-2">{state.name || 'Unnamed Project'}</h3>
        <p className="text-gray-400 mb-8">{state.description || 'No description provided.'}</p>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-3">Team Configuration</div>
            <div className="flex -space-x-2">
              {state.members.length === 0 ? <span className="text-gray-500 text-sm">No members assigned</span> : null}
              {users.filter(u => state.members.includes(u.id)).map(u => (
                <div key={u.id} className="w-8 h-8 rounded-full border-2 border-[#1e2128] bg-gray-700 flex items-center justify-center text-xs font-bold text-white" title={u.username}>
                  {u.first_name?.[0] || u.username[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>
          <div>
             <div className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-3">Audit Summary</div>
             <ul className="text-sm text-gray-300 space-y-2">
               <li className="flex justify-between"><span>Initial Tasks:</span> <span className="font-medium text-white">{state.tasks.length}</span></li>
               <li className="flex justify-between"><span>Notifications:</span> <span className="font-medium text-green-400">{state.notificationsEnabled ? 'Active' : 'Disabled'}</span></li>
               <li className="flex justify-between"><span>Security:</span> <span className="font-medium text-white">Private Team</span></li>
             </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-900 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )

  const isNextDisabled = () => {
    if (step === 1) return !state.name.trim()
    return false
  }

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col">
      {/* Header */}
      <header className="px-8 py-5 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Project Initialization Wizard</h1>
          <p className="text-sm text-gray-400">Step {step} of 5: {STEPS[step - 1].title}</p>
        </div>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-800 p-8 hidden md:block">
          <div className="space-y-8">
            {STEPS.map((s, idx) => (
              <div key={s.id} className={`flex items-center gap-4 ${step === s.id ? 'text-white' : step > s.id ? 'text-gray-400' : 'text-gray-700'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step === s.id ? 'border-red-500 bg-red-500/10 text-red-500' : 
                  step > s.id ? 'border-gray-500 bg-gray-800/50' : 'border-gray-800'
                }`}>
                  {step > s.id ? <Check className="w-5 h-5" /> : s.icon}
                </div>
                <div className="font-medium">{s.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 relative">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-white mb-8">{STEPS[step - 1].title}</h2>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-gray-800 flex justify-between items-center bg-[#0f1115]">
        <button 
          onClick={handlePrev}
          disabled={step === 1 || isSubmitting}
          className="px-6 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white disabled:opacity-0 transition-all flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        {step < 5 ? (
          <button 
            onClick={handleNext}
            disabled={isNextDisabled()}
            className="px-8 py-2.5 rounded-lg font-medium bg-white text-black hover:bg-gray-200 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            Continue <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={handleLaunch}
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-lg font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
          >
            {isSubmitting ? 'Launching...' : 'Initialize Project'} <Shield className="w-5 h-5" />
          </button>
        )}
      </footer>
    </div>
  )
}
