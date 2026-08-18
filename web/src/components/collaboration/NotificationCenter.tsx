"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { listNotifications, markAllRead } from '../../api/collaboration'
import type { Notification } from '../../types/collaboration'
import { Bell, CheckCheck, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function NotificationCenter() {
  const { currentUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    if (!currentUser || typeof window === 'undefined') return
    setLoading(true)
    try {
      const data = await listNotifications(currentUser.id)
      setNotifications(data)
    } catch {
      // Silent: backend may be temporarily unavailable, will retry on next interval
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  // Fetch on open
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  // Poll every 30s
  useEffect(() => {
    if (!currentUser) return
    const interval = setInterval(fetchNotifications, 30_000)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications()
    return () => clearInterval(interval)
  }, [currentUser, fetchNotifications])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleMarkAllRead = async () => {
    await markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors"
        style={{
          border: '1px solid var(--border-subtle)',
          background: open ? 'var(--brand)' : 'var(--surface-raised)',
          color: open ? '#fff' : 'var(--text-muted)',
        }}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ background: 'var(--brand)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--border-subtle)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold transition-colors hover:text-green-400"
                style={{ color: 'var(--text-muted)' }}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <Bell className="h-6 w-6" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>All caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-white/3"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    background: n.read ? 'transparent' : 'rgba(220,38,38,0.05)',
                  }}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: n.read ? 'transparent' : 'var(--brand)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {n.actor_name && (
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{n.actor_name} </span>
                      )}
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.created_at)}</span>
                      {n.work_item && (
                        <Link
                          href={`/work-items/${n.work_item}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-0.5 text-[10px] font-semibold transition-colors hover:text-red-500"
                          style={{ color: 'var(--brand)' }}
                        >
                          View <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
