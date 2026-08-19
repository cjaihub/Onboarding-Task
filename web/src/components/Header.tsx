"use client"
import { Search, Moon, Sun, Monitor, ChevronDown, LogOut, User, ArrowLeft, ArrowRight } from "lucide-react"
import { NotificationCenter } from './collaboration/NotificationCenter'
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useLayout } from "../contexts/LayoutContext"
import { useAuth } from "../contexts/AuthContext"

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toggleSidebar } = useLayout()
  const { user, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  // eslint-disable-next-line
  useEffect(() => { setMounted(true) }, [])

  const routeTitles: Record<string, { title: string; subtitle: string }> = {
    "/":            { title: "Dashboard",  subtitle: "Overview of your engineering operations" },
    "/my-work":     { title: "My Work",    subtitle: "Items assigned to you" },
    "/work-items":  { title: "Work Items", subtitle: "All tracking items" },
    "/board":       { title: "Board",      subtitle: "Kanban tracking" },
    "/projects":    { title: "Projects",   subtitle: "Project portfolios" },
    "/activity":    { title: "Activity",   subtitle: "Recent updates" },
    "/calendar":    { title: "Calendar",   subtitle: "Schedule and deadlines" },
    "/reports":     { title: "Reports",    subtitle: "Analytics and exports" },
  }

  const getRouteInfo = () => {
    if (pathname === "/") return routeTitles["/"]
    const baseRoute = "/" + pathname.split("/")[1]
    if (pathname.split("/").length > 2) {
      const parentInfo = routeTitles[baseRoute]
      return { title: `${parentInfo?.title || "Item"} Details`, subtitle: "Viewing specific item" }
    }
    return routeTitles[baseRoute] || { title: "Usalama", subtitle: "Engineering Operations" }
  }

  const { title } = getRouteInfo()

  // 3-way theme toggle: light → system → dark
  const themes = [
    { value: "light",  Icon: Sun,     label: "Light" },
    { value: "system", Icon: Monitor, label: "System" },
    { value: "dark",   Icon: Moon,    label: "Dark" },
  ] as const

  // Slider offset per position
  const sliderOffset: Record<string, number> = { light: 3, system: 33, dark: 63 }

  return (
    <header
      className="sticky top-0 z-10 flex h-14 md:h-20 items-center justify-between px-4 md:px-8 transition-all duration-200"
      style={{
        background: "var(--surface-card)",
        borderBottom: "1px solid var(--border-subtle)",
        boxShadow: "0 1px 0 var(--border-subtle)",
      }}
    >
      {/* Left — sidebar toggle + navigation + page title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Navigation Controls */}
        <div className="hidden md:flex items-center gap-1 mr-2">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.forward()}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="Go forward"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Title */}
        <div className="min-w-0">
          <h1
            className="text-lg md:text-base font-extrabold tracking-tight leading-none truncate"
            style={{ color: "var(--text-primary)" }}
            title={title}
          >
            {title}
          </h1>
          <p className="text-[10px] font-medium mt-1 truncate" style={{ color: "var(--text-muted)" }} title={getRouteInfo().subtitle}>
            {getRouteInfo().subtitle}
          </p>
        </div>
      </div>

      {/* Right — search, theme toggle, notifications, user */}
      <div className="flex items-center gap-3 flex-shrink-0">

        {/* Search */}
        <div className="relative hidden lg:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search anything..."
            className="h-10 w-60 rounded-xl pl-9 pr-14 text-sm transition-all focus:outline-none"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "var(--brand)"
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--brand-muted)"
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "var(--border-subtle)"
              e.currentTarget.style.boxShadow = "none"
            }}
            onChange={e => {
              if (e.target.value.trim().length > 0) {
                document.dispatchEvent(new CustomEvent('open-command-palette', { 
                  detail: { query: e.target.value } 
                }));
                // Clear the input so it doesn't get out of sync with CommandPalette
                e.target.value = '';
                e.target.blur();
              }
            }}
            onClick={() => {
              document.dispatchEvent(new CustomEvent('open-command-palette'));
            }}
          />
          <div
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded px-1.5 py-0.5"
            style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>⌘ K</span>
          </div>
        </div>

        {/* Live Notification Center */}
        <NotificationCenter />

        {/* Divider + User Switcher */}
        <div className="relative group pl-4 border-l" style={{ borderColor: "var(--border-subtle)" }}>
          <button 
            className="flex items-center gap-2 cursor-pointer transition-colors group-hover:text-red-500"
          >
            <span className="hidden sm:flex text-sm font-semibold items-center gap-1" style={{ color: "var(--text-secondary)" }}>
              {user ? (user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username) : "Guest"}
              <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
            </span>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
              style={{ background: "var(--brand)" }}
            >
              {user ? (user.first_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()) : "?"}
            </div>
          </button>
          
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden" 
               style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
            <div className="py-2">
              {/* Profile info */}
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: "var(--brand)" }}>
                    {user ? (user.first_name?.[0]?.toUpperCase() || user.username[0].toUpperCase()) : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : user?.username}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
                  </div>
                </div>
              </div>
              {/* Theme Settings */}
              {mounted && (
                <div className="px-2 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <p className="text-xs font-semibold mb-1 px-2 pt-1" style={{ color: "var(--text-muted)" }}>Theme</p>
                  <div className="flex flex-col gap-0.5">
                    {themes.map(({ value, Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`w-full text-left px-2 py-2 text-sm flex items-center justify-between rounded-md transition-colors ${theme === value ? 'bg-black/5 dark:bg-white/10 font-bold' : 'hover:bg-black/5 dark:hover:bg-white/5 font-medium'}`}
                        style={{ color: theme === value ? 'var(--text-primary)' : 'var(--text-muted)' }}
                        title={label}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </div>
                        {theme === value && <div className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors hover:bg-red-500/10"
                  style={{ color: '#f87171' }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  )
}
