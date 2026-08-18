"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ListTodo, Kanban, Activity, MoreHorizontal, FolderOpen, Calendar, FileText, Network, Settings, Briefcase } from "lucide-react"
import { cn } from "../lib/utils"
import { useState, useEffect } from "react"

const primaryItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Work', href: '/work-items', icon: ListTodo },
  { name: 'Board', href: '/board', icon: Kanban },
  { name: 'Activity', href: '/activity', icon: Activity },
]

const moreItems = [
  { name: 'My Work', href: '/my-work', icon: Briefcase },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Workflows', href: '/workflows', icon: Network },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isMoreOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }
    }
  }, [isMoreOpen])

  return (
    <>
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface-card)] border-t border-[var(--border-subtle)] pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
                  isActive ? "text-red-600 dark:text-red-500" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                )}
                onClick={() => setIsMoreOpen(false)}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-red-600 dark:text-red-500" : "")} />
                <span className="text-[10px] font-medium leading-none">{item.name}</span>
              </Link>
            )
          })}
          
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
              isMoreOpen ? "text-red-600 dark:text-red-500" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </div>

      {/* More Menu Bottom Sheet */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsMoreOpen(false)}>
          <div 
            className="absolute bottom-16 left-0 right-0 bg-[var(--surface-base)] rounded-t-2xl border-t border-[var(--border-subtle)] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Menu</h3>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="p-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <nav className="grid gap-1">
                {moreItems.map((item) => {
                   const isActive = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/')
                   return (
                     <Link
                       key={item.name}
                       href={item.href}
                       onClick={() => setIsMoreOpen(false)}
                       className={cn(
                         "flex items-center gap-3 p-3 rounded-xl transition-colors",
                         isActive 
                           ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500 font-medium" 
                           : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
                       )}
                     >
                       <div className={cn(
                         "flex items-center justify-center h-8 w-8 rounded-lg",
                         isActive ? "bg-red-100 dark:bg-red-900/50" : "bg-[var(--surface-card)] border border-[var(--border-subtle)]"
                       )}>
                          <item.icon className="h-4 w-4" />
                       </div>
                       <span className="text-sm font-semibold">{item.name}</span>
                     </Link>
                   )
                })}
              </nav>
              
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid gap-1">
                 <button className="flex items-center gap-3 p-3 rounded-xl transition-colors text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] w-full text-left">
                   <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                      <Settings className="h-4 w-4" />
                   </div>
                   <span className="text-sm font-semibold">Settings</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
