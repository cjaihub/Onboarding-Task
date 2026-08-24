"use client"
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, downloadFile } from '../../../lib/api-client'
import { Project, User, WorkItem, ProjectAttachment, ProjectComment } from '../../../types/api'
import { uploadProjectAttachment, updateProject, createProjectComment, deleteProjectAttachment } from '../../../api/projects'
import { fetchUsers } from '../../../api/users'
import { Shield, Settings, Activity, FolderOpen, Users, ListTodo, ChevronRight, BarChart2, ShieldAlert, User as UserIcon, Paperclip, MessageSquare, Save, X, UploadCloud, Download, Trash2, Send } from 'lucide-react'
import Link from 'next/link'
import { Spinner } from '../../../components/ui/Spinner'
import { ErrorState } from '../../../components/ui/ErrorState'

export default function ProjectDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = Number(params.id)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'attachments' | 'chat'>('dashboard')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [chatMessage, setChatMessage] = useState('')
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const { data: project, isLoading: isProjectLoading, error: projectError } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => apiClient<Project>(`/projects/${projectId}/`),
  })

  useEffect(() => {
    if (project && !isEditing) {
      setEditForm({ name: project.name, description: project.description })
    }
  }, [project, isEditing])

  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [project?.comments, activeTab])

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  })

  const { data: workItemsData, isLoading: isWorkItemsLoading } = useQuery({
    queryKey: ['workItems', { project: projectId, page_size: 100 }],
    queryFn: () => apiClient<{ results: WorkItem[] }>(`/work-items/?project=${projectId}&page_size=100`)
  })

  const updateMutation = useMutation({
    mutationFn: () => updateProject(projectId, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      setIsEditing(false)
    }
  })

  const chatMutation = useMutation({
    mutationFn: () => createProjectComment(projectId, chatMessage),
    onSuccess: () => {
      setChatMessage('')
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
    }
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      try {
        await uploadProjectAttachment(projectId, file, file.name)
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      } catch (err) {
        alert('Failed to upload file')
      }
    }
  }

  const handleDeleteAttachment = async (id: number) => {
    if (confirm('Are you sure you want to delete this attachment?')) {
      try {
        await deleteProjectAttachment(id)
        queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      } catch (err) {
        alert('Failed to delete file')
      }
    }
  }

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

  const teamMembers = project.members_detail || []

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <FolderOpen className="w-4 h-4" />
            <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-300">{project.name}</span>
          </div>
          
          {isEditing ? (
            <div className="space-y-4 max-w-2xl">
              <input
                value={editForm.name}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white text-2xl font-bold focus:border-red-500 outline-none"
              />
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({...editForm, description: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:border-red-500 outline-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Save size={16} /> Save
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
              <p className="text-gray-400 max-w-2xl">{project.description || 'No description provided for this project.'}</p>
            </div>
          )}
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-[#1e2128] hover:bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2 text-sm transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" /> Edit Project
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
          { id: 'attachments', label: 'Attachments', icon: <Paperclip size={16} /> },
          { id: 'chat', label: 'Team Chat', icon: <MessageSquare size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'border-red-500 text-red-500' 
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No members assigned to this project.</p>
                    ) : (
                      teamMembers.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-lg">
                          {user.profile?.avatar_url ? (
                            <img src={user.profile.avatar_url} alt={user.username} className="w-8 h-8 rounded-full object-cover border border-gray-700" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white border border-gray-700">
                              {user.first_name?.[0] || user.username[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">{user.first_name ? `${user.first_name} ${user.last_name}` : user.username}</div>
                            <div className="text-xs text-gray-500">{user.profile?.role || 'Member'}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                      <span className="text-gray-500">Created</span>
                      <span>{project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ATTACHMENTS TAB */}
        {activeTab === 'attachments' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#15171c] border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-gray-400" /> Project Files
              </h2>
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all"
                >
                  <UploadCloud size={16} /> Upload File
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {!project.attachments?.length ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                  <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
                  <p>No files attached to this project.</p>
                </div>
              ) : (
                project.attachments.map(att => (
                  <div key={att.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 flex flex-col gap-3 group hover:border-gray-600 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-900/20 text-red-500 rounded-lg">
                          <Paperclip size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white truncate max-w-[150px]" title={att.description}>
                            {att.description}
                          </div>
                          <div className="text-xs text-gray-500">By {att.uploaded_by_name}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800">
                      <span className="text-xs text-gray-500">{new Date(att.created_at).toLocaleDateString()}</span>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          downloadFile(att.file_url, att.description || 'download');
                        }}
                        className="text-red-500 hover:text-red-400 text-xs font-medium flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                      >
                        <Download size={14} /> Download
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#15171c] border border-gray-800 rounded-xl flex flex-col h-[600px] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 bg-[#1a1a1a] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-500" /> Team Discussion
              </h2>
              <div className="flex -space-x-2">
                {teamMembers.slice(0, 5).map(u => (
                   u.profile?.avatar_url ? (
                    <img key={u.id} src={u.profile.avatar_url} alt={u.username} className="w-8 h-8 rounded-full object-cover border-2 border-[#1a1a1a]" title={u.username} />
                  ) : (
                    <div key={u.id} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white border-2 border-[#1a1a1a]" title={u.username}>
                      {u.first_name?.[0] || u.username[0].toUpperCase()}
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={chatScrollRef}>
              {!project.comments?.length ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                  <p>Start the conversation.</p>
                </div>
              ) : (
                project.comments.map(msg => (
                  <div key={msg.id} className="flex items-start gap-4">
                    {msg.author_avatar ? (
                      <img src={msg.author_avatar} alt={msg.author_name} className="w-10 h-10 rounded-full object-cover shadow-md" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-white shadow-md">
                        {msg.author_name[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm relative group">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">{msg.author_name}</span>
                        <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-[#1a1a1a]">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (chatMessage.trim()) chatMutation.mutate();
                }}
                className="flex items-center gap-3"
              >
                <div className="flex-1 bg-[#0f1115] border border-gray-800 rounded-full px-4 py-2 flex items-center focus-within:border-red-500 transition-colors shadow-inner">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-none text-white focus:outline-none text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || chatMutation.isPending}
                  className="bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg shadow-red-600/20"
                >
                  <Send size={16} className={chatMessage.trim() ? "ml-1" : ""} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
