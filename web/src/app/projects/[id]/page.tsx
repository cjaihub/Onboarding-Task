"use client"
import React, { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../lib/api-client'
import { Project, User, WorkItem } from '../../../types/api'
import { Shield, Settings, Activity, FolderOpen, Users, ListTodo, ChevronRight, BarChart2, ShieldAlert, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import { Spinner } from '../../../components/ui/Spinner'
import { ErrorState } from '../../../components/ui/ErrorState'

export default function ProjectDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Number(params.id)

  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => apiClient<Project>(`/projects/${projectId}/`)
  })

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient<User[]>('/users/')
  })

  const { data: workItemsData, isLoading: isWorkItemsLoading } = useQuery({
    queryKey: ['workItems', { project: projectId, page_size: 100 }],
    queryFn: () => apiClient<{ results: WorkItem[] }>(`/work-items/?project=${projectId}&page_size=100`)
  })

  const isLoading = isProjectLoading || isUsersLoading || isWorkItemsLoading
  
  const workItems = workItemsData?.results || []
  
  const metrics = useMemo(() => {
    const total = workItems.length
    const open = workItems.filter(i => i.status === 'OPEN').length
    const inProgress = workItems.filter(i => i.status === 'IN_PROGRESS').length
    const resolved = workItems.filter(i => i.status === 'RESOLVED').length
    const critical = workItems.filter(i => i.priority === 'CRITICAL').length
    return { total, open, inProgress, resolved, critical }
  }, [workItems])

  if (isLoading) return <Spinner />
  if (projectError) return <ErrorState message="Failed to load project details." />
  if (!project) return <ErrorState message="Project not found." />

  const teamMembers = users.filter(u => (project.members || []).includes(u.id))

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <FolderOpen className="w-4 h-4" />
            <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-300">{project.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
          <p className="text-gray-400 max-w-2xl">{project.description || 'No description provided for this project.'}</p>
        </div>
        <button className="bg-[#1e2128] hover:bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2 text-sm transition-colors shadow-sm">
          <Settings className="w-4 h-4" /> Configure
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#15171c] border border-gray-800 rounded-xl p-5 relative overflow-hidden group hover:border-gray-700 transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <BarChart2 className="w-16 h-16 text-white" />
           </div>
           <div className="text-gray-400 text-sm font-medium mb-1">Total Tasks</div>
           <div className="text-3xl font-bold text-white">{metrics.total}</div>
        </div>
        <div className="bg-[#15171c] border border-gray-800 rounded-xl p-5 relative overflow-hidden group hover:border-amber-900/50 transition-colors">
           <div className="text-amber-500 text-sm font-medium mb-1">In Progress</div>
           <div className="text-3xl font-bold text-white">{metrics.inProgress}</div>
        </div>
        <div className="bg-[#15171c] border border-gray-800 rounded-xl p-5 relative overflow-hidden group hover:border-green-900/50 transition-colors">
           <div className="text-green-500 text-sm font-medium mb-1">Resolved</div>
           <div className="text-3xl font-bold text-white">{metrics.resolved}</div>
        </div>
        <div className="bg-[#15171c] border border-gray-800 rounded-xl p-5 relative overflow-hidden group hover:border-red-900/50 transition-colors">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <ShieldAlert className="w-16 h-16 text-red-500" />
           </div>
           <div className="text-red-500 text-sm font-medium mb-1">Critical Priority</div>
           <div className="text-3xl font-bold text-white">{metrics.critical}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content: Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#15171c] border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#1e2128]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-gray-400" /> Project Backlog
              </h2>
              <button 
                onClick={() => router.push(`/board?project=${project.id}`)}
                className="text-sm text-red-500 hover:text-red-400 font-medium"
              >
                View on Board &rarr;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {workItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <ListTodo className="w-12 h-12 mb-3 opacity-20" />
                  <p>No tasks associated with this project.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {workItems.map(item => (
                    <Link 
                      key={item.id} 
                      href={`/board?item=${item.id}`}
                      className="block p-3 rounded-lg hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">{item.reference_number}</span>
                          <span className="text-white font-medium">{item.title}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          item.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                          item.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                          item.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-green-500/20 text-green-500'
                        }`}>
                          {item.priority}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="capitalize">{item.status.replace('_', ' ').toLowerCase()}</span>
                        {item.assigned_to && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {users.find(u => u.id === item.assigned_to)?.username || 'Unknown'}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Team & Activity */}
        <div className="space-y-6">
          <div className="bg-[#15171c] border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Team Roster
            </h3>
            
            <div className="space-y-3">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No members assigned to this project.</p>
              ) : (
                teamMembers.map(user => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white border border-gray-700">
                      {user.first_name?.[0] || user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{user.first_name} {user.last_name}</div>
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-4 py-2 rounded border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 text-sm font-medium transition-colors">
              Manage Team
            </button>
          </div>

          <div className="bg-[#15171c] border border-gray-800 rounded-xl p-5">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Shield className="w-4 h-4" /> Security & Audit
             </h3>
             <ul className="text-sm space-y-3 text-gray-300">
               <li className="flex justify-between border-b border-gray-800 pb-2">
                 <span className="text-gray-500">Visibility</span>
                 <span className="font-medium">Private to Team</span>
               </li>
               <li className="flex justify-between border-b border-gray-800 pb-2">
                 <span className="text-gray-500">Notifications</span>
                 <span className="text-green-400 font-medium">Enabled</span>
               </li>
               <li className="flex justify-between">
                 <span className="text-gray-500">Created</span>
                 <span>{project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</span>
               </li>
             </ul>
          </div>
        </div>
        
      </div>
    </div>
  )
}
