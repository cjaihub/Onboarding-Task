'use client';

import React, { useState } from 'react';
import ProjectTable from '@/components/projects/ProjectTable';
import { DashboardStats } from '@/types/api';
import { LayoutDashboard, CheckCircle, Clock, AlertCircle, Layers } from 'lucide-react';

function StatRow({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border-subtle last:border-0">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className={`font-semibold text-sm ${accent ?? 'text-text-primary'}`}>{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  return (
    <div className="page-enter max-w-7xl mx-auto space-y-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand/10 rounded-xl">
          <LayoutDashboard className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-text-muted mt-0.5 text-sm">Master overview of all projects, workflows, and tasks.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 xl:gap-8">

        {/* Table — takes 3/4 on xl */}
        <div className="xl:col-span-3">
          {/* ProjectTable calls onStatsLoaded to propagate live stats upward */}
          <ProjectTable onStatsLoaded={setStats} />
        </div>

        {/* Sidebar stats — takes 1/4 on xl, full-width stacked on mobile */}
        <div className="xl:col-span-1 space-y-4">

          {/* Work Item Stats */}
          <div className="surface-card rounded-xl p-5">
            <h3 className="font-semibold text-text-primary mb-1 flex items-center gap-2">
              <Layers size={16} className="text-brand" /> Work Tasks
            </h3>
            <p className="text-xs text-text-muted mb-4">Live counts by status</p>
            {stats ? (
              <div>
                <StatRow label="Total" value={stats.total} />
                <StatRow label="Open" value={stats.open} accent="text-blue-400" />
                <StatRow label="In Progress" value={stats.in_progress} accent="text-amber-400" />
                <StatRow label="In Review" value={stats.review} accent="text-purple-400" />
                <StatRow label="Resolved" value={stats.resolved} accent="text-emerald-400" />
                <StatRow label="Closed" value={stats.closed} />
              </div>
            ) : (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-5 bg-surface-raised rounded animate-pulse" />
                ))}
              </div>
            )}
          </div>

          {/* Health indicators */}
          <div className="surface-card rounded-xl p-5">
            <h3 className="font-semibold text-text-primary mb-1 flex items-center gap-2">
              <AlertCircle size={16} className="text-brand" /> Health
            </h3>
            <p className="text-xs text-text-muted mb-4">Alerts & overdue</p>
            {stats ? (
              <div>
                <div className="flex items-center justify-between py-3 border-b border-border-subtle">
                  <span className="text-sm text-text-secondary flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-red-400" /> Critical
                  </span>
                  <span className={`font-semibold text-sm ${stats.critical > 0 ? 'text-red-400' : 'text-text-primary'}`}>
                    {stats.critical}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-text-secondary flex items-center gap-1.5">
                    <Clock size={13} className="text-orange-400" /> Overdue
                  </span>
                  <span className={`font-semibold text-sm ${stats.overdue > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {stats.overdue}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-5 bg-surface-raised rounded animate-pulse" />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {stats?.recent_activity && stats.recent_activity.length > 0 && (
            <div className="surface-card rounded-xl p-5">
              <h3 className="font-semibold text-text-primary mb-1 flex items-center gap-2">
                <CheckCircle size={16} className="text-brand" /> Recent Activity
              </h3>
              <p className="text-xs text-text-muted mb-4">Last 5 changes</p>
              <ul className="space-y-3">
                {stats.recent_activity.slice(0, 5).map(act => (
                  <li key={act.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-text-secondary">
                        <span className="text-text-primary font-medium">{act.actor_name ?? 'System'}</span>
                        {' '}{act.activity_type.toLowerCase()}
                        {act.field_changed ? ` ${act.field_changed}` : ''}
                      </span>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
