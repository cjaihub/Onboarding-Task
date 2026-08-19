'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProjects } from '@/api/projects';
import { fetchWorkItems } from '@/api/workItems';
import { apiClient } from '@/lib/api-client';
import { Project, WorkItem, User, DashboardStats } from '@/types/api';
import {
  ChevronDown, ChevronRight, Folder, Layout,
  ListTodo, Plus, X, Mail, Phone, Briefcase, User as UserIcon,
} from 'lucide-react';

// ─── Member Detail Slide Panel ────────────────────────────────────────────────
function MemberPanel({ member, onClose }: { member: User | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
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
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${member ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-full shadow-2xl flex flex-col transition-transform duration-300 ease-out
          surface-card border-l border-border-subtle
          ${member ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Member Details"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">Team Member</span>
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
            {/* Avatar & Name */}
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

            {/* Detail Rows */}
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
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [projData, itemsData, statsData] = await Promise.all([
          fetchProjects(),
          fetchWorkItems({}),
          apiClient<DashboardStats>('/dashboard/').catch(() => null),
        ]);
        setProjects(projData);
        setWorkItems(itemsData.results || []);
        if (statsData && onStatsLoaded) onStatsLoaded(statsData);
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [onStatsLoaded]);

  const toggleProject = (id: number) =>
    setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));

  const handleWorkItemClick = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    router.push(`/work-items/${itemId}`);
  };

  const handleMemberClick = (e: React.MouseEvent, member: User) => {
    e.stopPropagation();
    setSelectedMember(member);
  };

  if (loading) {
    return (
      <div className="w-full space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="surface-card rounded-xl h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <MemberPanel member={selectedMember} onClose={() => setSelectedMember(null)} />

      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex flex-wrap gap-3 justify-between items-end">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-1">Projects Overview</h2>
            <p className="text-sm text-text-secondary">Manage your projects and their associated work items.</p>
          </div>
          <button
            onClick={() => router.push('/projects/setup')}
            className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* Table */}
        <div className="surface-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle text-text-muted uppercase tracking-wider text-xs" style={{ background: 'var(--surface-raised)' }}>
                <tr>
                  <th className="px-4 sm:px-6 py-4 font-medium">Project / Work Item</th>
                  <th className="px-4 sm:px-6 py-4 font-medium hidden sm:table-cell">Type</th>
                  <th className="px-4 sm:px-6 py-4 font-medium">Status</th>
                  <th className="px-4 sm:px-6 py-4 font-medium text-right">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                      <Folder size={32} className="mx-auto mb-3 opacity-30" />
                      No projects found.
                    </td>
                  </tr>
                )}

                {projects.map(project => {
                  const isExpanded = !!expandedProjects[project.id];
                  const projectItems = workItems.filter(w => w.project === project.id);
                  const members: User[] = project.members_detail || [];

                  return (
                    <React.Fragment key={project.id}>
                      {/* ── Project Row ── */}
                      <tr
                        className="group hover:bg-brand-muted transition-colors cursor-pointer"
                        onClick={() => toggleProject(project.id)}
                      >
                        <td className="px-4 sm:px-6 py-4">
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

                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-base border border-border-subtle text-xs text-text-secondary">
                            <Layout size={11} />
                            {project.project_type}
                          </span>
                        </td>

                        <td className="px-4 sm:px-6 py-4 text-text-muted text-xs">—</td>

                        <td className="px-4 sm:px-6 py-4">
                          {/* Member Avatars — clickable */}
                          <div className="flex justify-end -space-x-2">
                            {members.slice(0, 4).map((m, idx) => (
                              <button
                                key={m.id}
                                title={m.first_name ? `${m.first_name} ${m.last_name}` : m.username}
                                onClick={e => handleMemberClick(e, m)}
                                className={`w-7 h-7 rounded-full border-2 border-surface-card flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110 hover:z-10 relative cursor-pointer ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                              >
                                {m.profile?.avatar_url
                                  ? <img src={m.profile.avatar_url} alt={m.username} className="w-full h-full rounded-full object-cover" />
                                  : memberInitials(m)
                                }
                              </button>
                            ))}
                            {members.length > 4 && (
                              <div className="w-7 h-7 rounded-full bg-surface-raised border-2 border-surface-card flex items-center justify-center text-[10px] font-bold text-text-secondary">
                                +{members.length - 4}
                              </div>
                            )}
                            {members.length === 0 && (
                              <span className="text-text-muted text-xs">—</span>
                            )}
                          </div>
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
                            <td className="px-4 sm:px-6 py-3 pl-12 sm:pl-16">
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

                            <td className="px-4 sm:px-6 py-3 text-text-muted text-xs hidden sm:table-cell">
                              {item.category}
                            </td>

                            <td className="px-4 sm:px-6 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${STATUS_CLASSES[item.status] || STATUS_CLASSES.OPEN}`}>
                                {item.status.replace('_', ' ')}
                              </span>
                            </td>

                            <td className="px-4 sm:px-6 py-3 text-right">
                              {assignedUser ? (
                                <button
                                  title={assignedUser.first_name ? `${assignedUser.first_name} ${assignedUser.last_name}` : assignedUser.username}
                                  onClick={e => handleMemberClick(e, assignedUser)}
                                  className={`inline-flex w-6 h-6 rounded-full border border-surface-card items-center justify-center text-[9px] font-bold transition-transform hover:scale-110 cursor-pointer ${AVATAR_COLORS[assignedUser.id % AVATAR_COLORS.length]}`}
                                >
                                  {assignedUser.profile?.avatar_url
                                    ? <img src={assignedUser.profile.avatar_url} alt={assignedUser.username} className="w-full h-full rounded-full object-cover" />
                                    : memberInitials(assignedUser)
                                  }
                                </button>
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
