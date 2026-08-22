'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProjects, addProjectMember, removeProjectMember } from '@/api/projects';
import { fetchWorkItems } from '@/api/workItems';
import { fetchUsers } from '@/api/users';
import { apiClient } from '@/lib/api-client';
import { Project, WorkItem, User, DashboardStats } from '@/types/api';
import {
  ChevronDown, ChevronRight, Folder, Layout,
  ListTodo, Plus, X, Mail, Phone, Briefcase, User as UserIcon,
  Search, Filter, Trash2, ArrowRight
} from 'lucide-react';

const PROJECT_TYPES = ['All', 'BACKEND', 'FRONTEND', 'FULLSTACK', 'MOBILE', 'API', 'UIUX', 'INFRA'];

// ─── Member Detail Slide Panel ────────────────────────────────────────────────
function MemberPanel({ member, project, projectItems, onClose, onRemove, onAssignTask }: { 
  member: User | null; 
  project: Project | null;
  projectItems: WorkItem[];
  onClose: () => void;
  onRemove: (userId: number) => void;
  onAssignTask: (userId: number) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (member) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [member, onClose]);

  const initials = member
    ? (member.first_name && member.last_name
        ? `${member.first_name[0]}${member.last_name[0]}`
        : member.username.slice(0, 2)
      ).toUpperCase()
    : '';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${member ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-full shadow-2xl flex flex-col transition-transform duration-300 ease-out
          surface-card border-l border-border-subtle
          ${member ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Member Details"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand/20 bg-brand/5">
          <span className="text-sm font-semibold text-brand uppercase tracking-wider">Team Member</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-brand-muted text-text-muted hover:text-brand transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {member && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 rounded-full bg-brand/15 border-2 border-brand/30 flex items-center justify-center text-2xl font-bold text-brand">
                {member.profile?.avatar_url
                  ? <img src={member.profile.avatar_url} alt={member.username} className="w-full h-full rounded-full object-cover" />
                  : initials
                }
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">
                  {member.first_name && member.last_name
                    ? `${member.first_name} ${member.last_name}`
                    : member.username}
                </div>
                <div className="text-sm text-text-muted">@{member.username}</div>
              </div>
            </div>

            <div className="space-y-3">
              {member.profile?.role && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised">
                  <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
                    <Briefcase size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Role</div>
                    <div className="text-sm font-medium text-text-primary">{member.profile.role}</div>
                  </div>
                </div>
              )}

              {member.email && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised">
                  <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Mail size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Email</div>
                    <div className="text-sm font-medium text-text-primary truncate">{member.email}</div>
                  </div>
                </div>
              )}

              {member.profile?.phone_number && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised">
                  <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                    <Phone size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider">Phone</div>
                    <div className="text-sm font-medium text-text-primary">{member.profile.phone_number}</div>
                  </div>
                </div>
              )}

              {member.profile?.bio && (
                <div className="p-3 rounded-lg bg-surface-raised">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Bio</div>
                  <p className="text-sm text-text-secondary leading-relaxed">{member.profile.bio}</p>
                </div>
              )}

              {/* Enhanced Member Actions & Project Context */}
              {project && (
                <div className="pt-6 border-t border-border-subtle mt-6">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-3">Project Actions: {project.name}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAssignTask(member.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-brand/10 hover:bg-brand/20 text-brand py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus size={16} /> Assign Task
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.username} from this project?`)) {
                          onRemove(member.id);
                        }
                      }}
                      className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      title="Remove from Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="mt-6">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-3">Tasks assigned to {member.username}</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {projectItems.filter(item => item.assigned_to === member.id).length === 0 ? (
                        <p className="text-xs text-text-muted italic">No tasks assigned in this project.</p>
                      ) : (
                        projectItems.filter(item => item.assigned_to === member.id).map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded bg-surface-base border border-border-subtle hover:border-brand/30 transition-colors cursor-pointer">
                            <div className="min-w-0">
                              <div className="text-xs font-mono text-brand">{item.reference_number}</div>
                              <div className="text-sm text-text-primary truncate pr-2">{item.title}</div>
                            </div>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border ${STATUS_CLASSES[item.status] || STATUS_CLASSES.OPEN}`}>{item.status.replace('_', ' ')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CLASSES: Record<string, string> = {
  OPEN:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  REVIEW:      'bg-purple-500/10 text-purple-400 border-purple-500/20',
  RESOLVED:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CLOSED:      'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const PROJECT_STATUS_CLASSES: Record<string, string> = {
  PLANNING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ON_HOLD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  COMPLETED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const AVATAR_COLORS = [
  'bg-red-500/20 text-red-400',
  'bg-blue-500/20 text-blue-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-purple-500/20 text-purple-400',
  'bg-amber-500/20 text-amber-400',
  'bg-cyan-500/20 text-cyan-400',
];

function memberInitials(m: User) {
  if (m.first_name && m.last_name) return `${m.first_name[0]}${m.last_name[0]}`.toUpperCase();
  return m.username.slice(0, 2).toUpperCase();
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface ProjectTableProps {
  onStatsLoaded?: (stats: DashboardStats) => void;
}

export default function ProjectTable({ onStatsLoaded }: ProjectTableProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
  const [selectedMember, setSelectedMember] = useState<{user: User, projectId: number} | null>(null);
  const [projectAddingMember, setProjectAddingMember] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    async function loadInitData() {
      try {
        const [itemsData, statsData, usersData] = await Promise.all([
          fetchWorkItems({}),
          apiClient<DashboardStats>('/dashboard/').catch(() => null),
          fetchUsers(),
        ]);
        setWorkItems(itemsData.results || []);
        setAllUsers(usersData);
        if (statsData && onStatsLoaded) onStatsLoaded(statsData);
      } catch (e) {
        console.error('Failed to load initial data', e);
      }
    }
    loadInitData();
  }, [onStatsLoaded]);

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const projData = await fetchProjects({
          search: debouncedSearch || undefined,
          project_type: activeTab === 'All' ? undefined : activeTab
        });
        setProjects(projData);
      } catch (e) {
        console.error('Failed to fetch projects', e);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [debouncedSearch, activeTab]);

  const toggleProject = (id: number) =>
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));

  const handleWorkItemClick = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    router.push(`/work-items/${itemId}`);
  };

  const handleMemberClick = (e: React.MouseEvent, member: User, projectId: number) => {
    e.stopPropagation();
    setSelectedMember({ user: member, projectId });
  };

  const handleAddMemberClick = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    setProjectAddingMember(projectId === projectAddingMember ? null : projectId);
  };

  const onAddProjectMember = async (projectId: number, userId: number) => {
    try {
      const updatedProject = await addProjectMember(projectId, userId);
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      setProjectAddingMember(null);
    } catch (e) {
      console.error('Failed to add member', e);
    }
  };

  const onRemoveProjectMember = async (projectId: number, userId: number) => {
    try {
      const updatedProject = await removeProjectMember(projectId, userId);
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      setSelectedMember(null);
    } catch (e) {
      console.error('Failed to remove member', e);
    }
  };

  const renderAvatars = (members: User[], projectId: number) => {
    const displayMembers = members.slice(0, 3);
    const extraCount = members.length - 3;

    return (
      <div className="flex items-center justify-end">
        <div className="flex -space-x-2 mr-2">
          {displayMembers.map((member, i) => (
            <button
              key={member.id}
              onClick={e => handleMemberClick(e, member, projectId)}
              title={member.first_name ? `${member.first_name} ${member.last_name}` : member.username}
              className={`w-7 h-7 rounded-full border-2 border-surface-card flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110 cursor-pointer ${AVATAR_COLORS[i % AVATAR_COLORS.length]} z-[${10 - i}] relative`}
            >
              {member.profile?.avatar_url
                ? <img src={member.profile.avatar_url} alt={member.username} className="w-full h-full rounded-full object-cover" />
                : memberInitials(member)
              }
            </button>
          ))}
          {extraCount > 0 && (
            <div className="w-7 h-7 rounded-full bg-surface-raised border-2 border-surface-card flex items-center justify-center text-[10px] font-medium text-text-muted z-0 relative">
              +{extraCount}
            </div>
          )}
        </div>
        <div className="relative">
          <button 
            onClick={(e) => handleAddMemberClick(e, projectId)}
            className="w-7 h-7 rounded-full border-2 border-dashed border-text-muted flex items-center justify-center text-text-muted hover:text-brand hover:border-brand transition-colors cursor-pointer"
          >
            <Plus size={14} />
          </button>
          {projectAddingMember === projectId && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-card border border-border-subtle rounded-lg shadow-xl z-50 py-1" onClick={e => e.stopPropagation()}>
              <div className="px-3 py-2 text-xs font-semibold text-text-muted border-b border-border-subtle mb-1">Add Member</div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {allUsers.filter(u => !members.find(m => m.id === u.id)).map(user => (
                  <button 
                    key={user.id}
                    onClick={(e) => { e.stopPropagation(); onAddProjectMember(projectId, user.id); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-brand/10 transition-colors flex items-center gap-2"
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${AVATAR_COLORS[user.id % AVATAR_COLORS.length]}`}>
                      {memberInitials(user)}
                    </span>
                    <span className="truncate">{user.username}</span>
                  </button>
                ))}
                {allUsers.filter(u => !members.find(m => m.id === u.id)).length === 0 && (
                  <div className="px-3 py-2 text-xs text-text-muted italic">No users available</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredProjects = projects;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-base animate-pulse">
        <Layout size={40} className="text-border-subtle mb-4" />
        <div className="h-4 w-48 bg-border-subtle rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-base">
      <MemberPanel 
        member={selectedMember?.user || null} 
        project={selectedMember ? projects.find(p => p.id === selectedMember.projectId) || null : null}
        projectItems={selectedMember ? workItems.filter(w => w.project === selectedMember.projectId) : []}
        onClose={() => setSelectedMember(null)}
        onRemove={(userId) => {
          if (selectedMember) onRemoveProjectMember(selectedMember.projectId, userId);
        }}
        onAssignTask={(userId) => {
          if (selectedMember) router.push(`/projects/${selectedMember.projectId}`);
        }}
      />

      <div className="w-full space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-1">Projects Overview</h2>
            <p className="text-sm text-text-secondary">Manage your projects and their associated work items.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-surface-card border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => router.push('/projects/setup')}
              className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        {PROJECT_TYPES.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <Filter size={16} className="text-brand mr-1 flex-shrink-0" />
            {PROJECT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === type
                    ? 'bg-brand text-white'
                    : 'bg-surface-card text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Responsive Grid/Table container */}
        <div className="surface-card rounded-xl overflow-hidden border border-border-subtle">
          
          {/* Mobile Card View (< sm) */}
          <div className="block sm:hidden divide-y divide-border-subtle">
            {filteredProjects.length === 0 && (
              <div className="p-8 text-center text-text-muted">
                <Folder size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No projects found.</p>
              </div>
            )}
            
            {filteredProjects.map(project => {
              const isExpanded = !!expandedProjects[project.id];
              const projectItems = workItems.filter(w => w.project === project.id);
              const members = project.members_detail || [];

              return (
                <div key={project.id} className="p-4">
                  {/* Project Card Header */}
                  <div 
                    className="flex justify-between items-start gap-3 cursor-pointer"
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand flex-shrink-0 mt-0.5">
                        <Folder size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary truncate">{project.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-surface-base border border-border-subtle text-text-secondary">
                            <Layout size={10} />
                            {project.project_type}
                          </span>
                          <span className="text-xs text-text-muted">{projectItems.length} items</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-text-muted hover:text-brand transition-colors p-1">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                  </div>
                  
                  {/* Project Card Body - Only shown if members exist or expanded */}
                  <div className="mt-4 flex items-center justify-between">
                     <div className="text-xs font-medium text-text-secondary">Team</div>
                     {renderAvatars(members)}
                  </div>

                  {/* Nested Work Items */}
                  {isExpanded && (
                    <div className="mt-4 space-y-2 border-t border-border-subtle pt-3">
                      {projectItems.length === 0 ? (
                        <p className="text-xs text-text-muted italic text-center py-2">No tasks in this project yet.</p>
                      ) : (
                        projectItems.map(item => {
                          const assignedUser = members.find(m => m.id === item.assigned_to);
                          return (
                            <div
                              key={`m-item-${item.id}`}
                              onClick={(e) => handleWorkItemClick(e, item.id)}
                              className="flex items-center justify-between p-3 rounded-lg bg-surface-base border border-border-subtle active:scale-[0.98] transition-transform"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <ListTodo size={14} className="text-text-muted flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-text-primary truncate">
                                    <span className="text-brand font-mono mr-1">{item.reference_number}</span>
                                    {item.title}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${STATUS_CLASSES[item.status] || STATUS_CLASSES.OPEN}`}>
                                      {item.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {assignedUser && (
                                <button
                                  onClick={e => handleMemberClick(e, assignedUser)}
                                  className={`ml-2 w-6 h-6 flex-shrink-0 rounded-full border border-surface-card flex items-center justify-center text-[8px] font-bold ${AVATAR_COLORS[assignedUser.id % AVATAR_COLORS.length]}`}
                                >
                                  {assignedUser.profile?.avatar_url
                                    ? <img src={assignedUser.profile.avatar_url} alt={assignedUser.username} className="w-full h-full rounded-full object-cover" />
                                    : memberInitials(assignedUser)
                                  }
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle text-text-muted uppercase tracking-wider text-xs" style={{ background: 'var(--surface-raised)' }}>
                <tr>
                  <th className="px-6 py-4 font-medium w-1/2">Project / Work Item</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                      <Folder size={32} className="mx-auto mb-3 opacity-30" />
                      No projects found matching your criteria.
                    </td>
                  </tr>
                )}

                {filteredProjects.map(project => {
                  const isExpanded = !!expandedProjects[project.id];
                  const projectItems = workItems.filter(w => w.project === project.id);
                  const members = project.members_detail || [];

                  return (
                    <React.Fragment key={project.id}>
                      {/* ── Project Row ── */}
                      <tr
                        className="group hover:bg-brand-muted transition-colors cursor-pointer"
                        onClick={() => toggleProject(project.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button className="text-text-muted group-hover:text-brand transition-colors flex-shrink-0">
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand flex-shrink-0">
                              <Folder size={15} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-text-primary truncate">{project.name}</div>
                              <div className="text-xs text-text-muted">{projectItems.length} item{projectItems.length !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-base border border-border-subtle text-xs text-text-secondary">
                            <Layout size={11} />
                            {project.project_type}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${PROJECT_STATUS_CLASSES[project.status || 'PLANNING'] || PROJECT_STATUS_CLASSES.PLANNING}`}>
                            {(project.status || 'PLANNING').replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {renderAvatars(members, project.id)}
                        </td>
                      </tr>

                      {/* ── Nested Work Item Rows ── */}
                      {isExpanded && projectItems.map(item => {
                        const assignedUser = members.find(m => m.id === item.assigned_to);

                        return (
                          <tr
                            key={`item-${item.id}`}
                            className="bg-surface-base/40 hover:bg-brand-muted/60 transition-colors cursor-pointer group/item"
                            onClick={e => handleWorkItemClick(e, item.id)}
                          >
                            <td className="px-6 py-3 pl-16">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-md bg-surface-card border border-border-subtle flex items-center justify-center text-text-muted flex-shrink-0">
                                  <ListTodo size={12} />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-medium text-text-primary text-sm flex flex-wrap items-center gap-1.5">
                                    <span className="text-brand text-xs font-mono">{item.reference_number}</span>
                                    <span className="text-text-secondary font-normal truncate group-hover/item:text-text-primary transition-colors">{item.title}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-3 text-text-muted text-xs">
                              {item.category}
                            </td>

                            <td className="px-6 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${STATUS_CLASSES[item.status] || STATUS_CLASSES.OPEN}`}>
                                {item.status.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="px-6 py-3 text-right">
                              {assignedUser ? (
                                <div className="flex justify-end">
                                  <button
                                    title={assignedUser.first_name ? `${assignedUser.first_name} ${assignedUser.last_name}` : assignedUser.username}
                                    onClick={e => handleMemberClick(e, assignedUser, project.id)}
                                    className={`inline-flex w-6 h-6 rounded-full border border-surface-card items-center justify-center text-[9px] font-bold transition-transform hover:scale-110 cursor-pointer ${AVATAR_COLORS[assignedUser.id % AVATAR_COLORS.length]}`}
                                  >
                                    {assignedUser.profile?.avatar_url
                                      ? <img src={assignedUser.profile.avatar_url} alt={assignedUser.username} className="w-full h-full rounded-full object-cover" />
                                      : memberInitials(assignedUser)
                                    }
                                  </button>
                                </div>
                              ) : (
                                <span className="text-text-muted text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {isExpanded && projectItems.length === 0 && (
                        <tr className="bg-surface-base/40">
                          <td colSpan={4} className="px-6 py-4 pl-16 text-text-muted text-sm italic">
                            No tasks in this project yet.
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
