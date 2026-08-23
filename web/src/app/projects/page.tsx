'use client';

import React from 'react';
import ProjectTable from '@/components/projects/ProjectTable';
import { FolderOpen } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="page-enter max-w-7xl mx-auto space-y-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand/10 rounded-xl">
          <FolderOpen className="w-6 h-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">Projects</h1>
          <p className="text-text-muted mt-0.5 text-sm">Manage your engineering project portfolios and workflows.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <ProjectTable />
      </div>
    </div>
  );
}
