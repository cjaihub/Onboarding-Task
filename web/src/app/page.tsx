"use client"
import Link from "next/link"
import { useDashboardQuery, useWorkItemsQuery } from "../hooks/queries"
import { ErrorState } from "../components/ui/ErrorState"
import { Skeleton } from "../components/ui/Skeleton"
import { Badge } from "../components/ui/Badge"
import { LayoutDashboard, AlertCircle, Clock, CircleDot, Calendar, ChevronRight, Activity, ShieldAlert, CheckCircle2 } from "lucide-react"

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}

const MetricCard = ({ title, value, subtitle, icon: Icon, color, loading }: MetricCardProps) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1115] p-5 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
    </div>
    <div className="mt-4">
      {loading ? (
        <Skeleton className="h-8 w-16 mb-2" />
      ) : (
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
      )}
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardQuery()
  const { data: criticalData, isLoading: criticalLoading } = useWorkItemsQuery({ priority: 'CRITICAL' })
  const { data: upcomingData, isLoading: upcomingLoading } = useWorkItemsQuery({ ordering: 'due_date' })

  if (statsError) {
    return <ErrorState title="Failed to load dashboard statistics" />
  }

  const total = stats?.total || 0;
  const open = stats?.open || 0;
  const inProgress = stats?.in_progress || 0;
  const resolved = stats?.resolved || 0;
  const closed = stats?.closed || 0;
  const review = stats?.review || 0;
  
  const critical = stats?.critical || 0;
  const overdueCount = stats?.overdue || 0;

  const today = new Date();
  const overdueItems = upcomingData?.results?.filter(i => i.due_date && new Date(i.due_date) < today && i.status !== 'RESOLVED' && i.status !== 'CLOSED') || [];

  const getPct = (val: number) => total ? Math.round((val / total) * 100) : 0;
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header section is in the Layout, but we can add page-specific titles here if needed */}
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">KPI Overview</h2>
      </div>

      {/* KPI ROW */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-3 lg:grid-cols-6 hide-scrollbar">
        <div className="snap-center shrink-0 w-64 md:w-auto">
          <MetricCard 
            title="Total Items" 
            value={total} 
            subtitle="All active items" 
            icon={LayoutDashboard} 
            color="text-gray-700 dark:text-gray-300"
            loading={statsLoading} 
          />
        </div>
        <div className="snap-center shrink-0 w-64 md:w-auto">
          <MetricCard 
            title="Open" 
            value={open} 
            subtitle={`${getPct(open)}% of total`} 
            icon={CircleDot} 
            color="text-gray-500"
            loading={statsLoading} 
          />
        </div>
        <div className="snap-center shrink-0 w-64 md:w-auto">
          <MetricCard 
            title="In Progress" 
            value={inProgress} 
            subtitle={`${getPct(inProgress)}% of total`} 
            icon={Activity} 
            color="text-amber-500"
            loading={statsLoading} 
          />
        </div>
        <div className="snap-center shrink-0 w-64 md:w-auto">
          <MetricCard 
            title="Critical" 
            value={critical} 
            subtitle="Requires immediate action" 
            icon={ShieldAlert} 
            color="text-red-600"
            loading={criticalLoading} 
          />
        </div>
        <div className="snap-center shrink-0 w-64 md:w-auto">
          <MetricCard 
            title="Overdue" 
            value={overdueCount} 
            subtitle="Past due date" 
            icon={Clock} 
            color="text-orange-500"
            loading={upcomingLoading} 
          />
        </div>
        <div className="snap-center shrink-0 w-64 md:w-auto">
          <MetricCard 
            title="Resolved" 
            value={resolved} 
            subtitle={`${getPct(resolved)}% of total`} 
            icon={CheckCircle2} 
            color="text-green-500"
            loading={statsLoading} 
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STATUS OVERVIEW */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1115] p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Work Items by Status</h3>
            {statsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div style={{ width: `${getPct(open)}%` }} className="bg-gray-400 transition-all duration-500" title="Open"></div>
                  <div style={{ width: `${getPct(inProgress)}%` }} className="bg-amber-500 transition-all duration-500" title="In Progress"></div>
                  <div style={{ width: `${getPct(review)}%` }} className="bg-purple-500 transition-all duration-500" title="Review"></div>
                  <div style={{ width: `${getPct(resolved)}%` }} className="bg-green-500 transition-all duration-500" title="Resolved"></div>
                  <div style={{ width: `${getPct(closed)}%` }} className="bg-gray-600 transition-all duration-500" title="Closed"></div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-400"></div>Open ({open})</div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500"></div>In Progress ({inProgress})</div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-purple-500"></div>Review ({review})</div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500"></div>Resolved ({resolved})</div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-600"></div>Closed ({closed})</div>
                </div>
              </div>
            )}
          </div>

          {/* ATTENTION REQUIRED */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1115] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" /> Attention Required
              </h3>
              <Link href="/work-items?priority=CRITICAL" className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {criticalLoading || upcomingLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="p-4 flex items-center justify-between"><Skeleton className="h-10 w-full" /></div>
                ))
              ) : (
                [...(criticalData?.results || []), ...overdueItems].slice(0, 5).map((item) => (
                  <Link key={item.id} href={`/work-items/${item.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">{item.title}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>{item.reference_number}</span>
                          <span>•</span>
                          <span>Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'None'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-red-600 transition-colors" />
                  </Link>
                ))
              )}
              {!criticalLoading && !upcomingLoading && (criticalData?.results?.length === 0 && overdueItems.length === 0) && (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No items require immediate attention.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1/3 width) */}
        <div className="space-y-6">
          
          {/* PRIORITY / RISK */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1115] p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Risk Distribution</h3>
            <div className="space-y-4">
              {[
                { label: 'Critical', count: stats?.by_priority?.['CRITICAL'] || 0, color: 'bg-red-600', loading: statsLoading },
                { label: 'High', count: stats?.by_priority?.['HIGH'] || 0, color: 'bg-orange-500', loading: statsLoading },
                { label: 'Medium', count: stats?.by_priority?.['MEDIUM'] || 0, color: 'bg-yellow-500', loading: statsLoading },
                { label: 'Low', count: stats?.by_priority?.['LOW'] || 0, color: 'bg-green-500', loading: statsLoading },
              ].map(risk => (
                <div key={risk.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${risk.color}`}></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{risk.label}</span>
                  </div>
                  {risk.loading ? <Skeleton className="h-4 w-8" /> : <span className="text-sm font-bold text-gray-900 dark:text-white">{risk.count}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* MY UPCOMING */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1115] shadow-sm overflow-hidden">
             <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" /> My Upcoming
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {upcomingLoading ? (
                 Array(3).fill(0).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-10 w-full" /></div>)
              ) : (
                upcomingData?.results?.slice(0, 4).map((item) => {
                  const isOverdue = item.due_date && new Date(item.due_date) < today;
                  return (
                    <Link key={item.id} href={`/work-items/${item.id}`} className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{item.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.reference_number}</p>
                        </div>
                        <Badge variant={isOverdue ? 'danger' : 'outline'} className="text-[10px]">
                          {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
                        </Badge>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
           <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1115] shadow-sm overflow-hidden">
             <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" /> Recent Activity
              </h3>
            </div>
            <div className="p-6 relative">
              <div className="absolute left-8 top-6 bottom-6 w-px bg-gray-200 dark:bg-gray-800"></div>
              <div className="space-y-6 relative z-0">
                {statsLoading ? (
                   Array(3).fill(0).map((_, i) => <div key={i} className="pl-6"><Skeleton className="h-8 w-full" /></div>)
                ) : (
                  stats?.recent_activity?.slice(0, 5).map((item) => (
                    <div key={item.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#0f1115] bg-gray-300 dark:bg-gray-600"></div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{item.activity_type.toLowerCase()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <Link href={`/work-items/${item.work_item}`} className="text-red-600 hover:underline">Item #{item.work_item}</Link> {item.field_changed ? `had ${item.field_changed} updated` : 'was updated'} by {item.actor_name || 'System'}.
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
