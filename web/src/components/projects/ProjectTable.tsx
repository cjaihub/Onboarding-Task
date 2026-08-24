'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProjects, addProjectMember, removeProjectMember } from '@/api/projects';
import { fetchWorkItems } from '@/api/workItems';
import { fetchUsers } from '@/api/users';
import { apiClient } from '@/lib/api-client';
import { Project, WorkItem, User, DashboardStats } from '@/types/api';
import {
  ChevronDown, ChevronRight, ChevronLeft, Folder, Layout,
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

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
    setCurrentPage(1); // Reset page on search or filter change
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
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

        {/* Responsive Grid Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-20 text-center text-text-muted surface-card rounded-xl border border-border-subtle">
              <Folder size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg mt-4">No projects found.</p>
            </div>
          )}

          {paginatedProjects.map(project => {
            const projectItems = workItems.filter(w => w.project === project.id);
            const members = project.members_detail || [];

            return (
              <div 
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="aspect-square surface-card rounded-2xl p-6 flex flex-col justify-between border border-border-subtle hover:border-brand/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                {/* Top: Icon and Type */}
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                    <Folder size={24} />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-base border border-border-subtle text-xs text-text-secondary">
                    <Layout size={12} />
                    {project.project_type}
                  </span>
                </div>

                {/* Middle: Title and Item Count */}
                <div className="mt-4 flex-1 flex flex-col justify-center">
                  <h3 className="text-lg font-bold text-text-primary line-clamp-2 leading-tight group-hover:text-brand transition-colors">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-text-muted text-sm">
                    <ListTodo size={14} />
                    <span>{projectItems.length} item{projectItems.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Bottom: Status & Team */}
                <div className="flex items-center justify-between pt-4 border-t border-border-subtle/50 mt-auto">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${PROJECT_STATUS_CLASSES[project.status || 'PLANNING'] || PROJECT_STATUS_CLASSES.PLANNING}`}>
                    {(project.status || 'PLANNING').replace('_', ' ')}
                  </span>
                  
                  <div onClick={(e) => { e.stopPropagation(); }}>
                    {renderAvatars(members, project.id)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 mt-2 border-t border-border-subtle">
            <span className="text-sm text-text-muted">
              Showing <span className="font-medium text-text-primary">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-text-primary">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)}</span> of <span className="font-medium text-text-primary">{filteredProjects.length}</span> projects
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border-subtle bg-surface-card text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border-subtle bg-surface-card text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
