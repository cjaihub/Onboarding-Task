"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListTodo, Kanban, Activity, Calendar, FileText, Briefcase, Star, Clock, FolderOpen, User, Settings, ChevronLeft, ChevronRight, Network } from 'lucide-react'
import { cn } from '../lib/utils'
import { useLayout } from '../contexts/LayoutContext'

const mainNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Work', href: '/my-work', icon: Briefcase },
  { name: 'Work Items', href: '/work-items', icon: ListTodo },
  { name: 'Board', href: '/board', icon: Kanban },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Workflows', href: '/workflows', icon: Network },
]

const shortcutItems = [
  { name: 'My Open Items', href: '/work-items?assignee=me&status=open', icon: Star, count: 8 },
  { name: 'Watched Items', href: '/work-items?watched=true', icon: Star, count: 14 },
  { name: 'Recently Updated', href: '/work-items?sort=-updated_at', icon: Clock },
]

const projectItems = [
  { name: 'Platform Core', icon: 'PC', color: 'bg-red-600' },
  { name: 'Mobile App', icon: 'MA', color: 'bg-orange-500' },
  { name: 'Web Portal', icon: 'WP', color: 'bg-pink-600' },
  { name: 'Infrastructure', icon: 'IN', color: 'bg-gray-500' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen, toggleSidebar } = useLayout()
  
  return (
    <div className={cn(
      "hidden md:flex h-full flex-col bg-white dark:bg-[#0f1115] text-gray-600 dark:text-gray-400 transition-all duration-300 relative border-r border-gray-200 dark:border-gray-800/50",
      isSidebarOpen ? "w-64" : "w-20"
    )}>
      
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md hover:bg-red-50 dark:hover:bg-red-600 hover:text-red-600 transition-colors z-50 border border-gray-200 dark:border-gray-700"
      >
        {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      <div className="flex h-20 shrink-0 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gradient-to-br from-red-500 to-red-700">
            <span className="text-white font-bold text-lg leading-none tracking-tighter">W</span>
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap">
              <span className="text-base font-bold text-gray-900 dark:text-white leading-tight">Usalama</span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider leading-tight">Engineering Operations</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar overflow-x-hidden">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-red-50 dark:bg-red-600/20 text-red-600 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white",
                  !isSidebarOpen && "justify-center px-0"
                )}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isSidebarOpen && "mr-3",
                    isActive ? "text-red-600 dark:text-white" : "text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-300"
                  )}
                />
                {isSidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {isSidebarOpen && (
          <>
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shortcuts</h3>
              <nav className="space-y-1">
                {shortcutItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                  >
                    <div className="flex items-center truncate">
                       <item.icon className="mr-3 h-4 w-4 flex-shrink-0 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-300" />
                       <span className="truncate">{item.name}</span>
                    </div>
                    {item.count && (
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs group-hover:bg-red-100 dark:group-hover:bg-red-600 group-hover:text-red-700 dark:group-hover:text-white transition-colors">{item.count}</span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-8 mb-4">
              <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h3>
                <Link href="/projects/setup" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" title="New Project">+</Link>
              </div>
              <nav className="space-y-1">
                {projectItems.map((item) => (
                  <Link
                    key={item.name}
                    href="#"
                    className="group flex items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                  >
                    <div className={`mr-3 h-5 w-5 flex-shrink-0 flex items-center justify-center rounded text-[9px] font-bold text-white ${item.color}`}>
                      {item.icon}
                    </div>
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </>
        )}
      </div>
      
      <div className="shrink-0 p-4 border-t border-gray-200 dark:border-gray-800/50">
        <div className={cn(
          "flex items-center rounded-xl bg-gray-50 dark:bg-gray-900/50 p-2 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer",
          isSidebarOpen ? "justify-between" : "justify-center"
        )}>
           <div className="flex items-center gap-3">
             <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                <User className="h-4 w-4 text-gray-500 dark:text-gray-300" />
             </div>
             {isSidebarOpen && (
               <div className="flex flex-col truncate">
                 <span className="text-sm font-medium text-gray-900 dark:text-white truncate">CJ Hub</span>
                 <span className="text-xs text-gray-500 truncate">Senior Developer</span>
               </div>
             )}
           </div>
           {isSidebarOpen && <Settings className="h-4 w-4 shrink-0 text-gray-500" />}
        </div>
      </div>
    </div>
  )
}
