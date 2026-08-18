"use client"

import React, { useEffect, useState } from 'react'
import { listCaptures } from '../../api/collaboration'
import type { VisualCapture } from '../../types/collaboration'
import { Camera, ExternalLink, Loader2, ImageOff } from 'lucide-react'
import { mediaUrl } from '../../lib/backend-url'

interface VisualFeedbackPanelProps {
  workItemId: number
  onAddCapture: () => void
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(date).toLocaleDateString()
}

export function VisualFeedbackPanel({ workItemId, onAddCapture }: VisualFeedbackPanelProps) {
  const [captures, setCaptures] = useState<VisualCapture[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCapture, setSelectedCapture] = useState<VisualCapture | null>(null)

  useEffect(() => {
    listCaptures({ work_item: workItemId })
      .then(setCaptures)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [workItemId])

  return (
    <section
      className="rounded-xl shadow-sm overflow-hidden"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 bg-[#0f1115]" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Camera className="h-4 w-4 text-gray-400" />
          Visual Feedback
          {captures.length > 0 && (
            <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'var(--brand)', color: '#fff' }}>
              {captures.length}
            </span>
          )}
        </h2>
        <button
          onClick={onAddCapture}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors text-white"
          style={{ background: 'var(--brand)' }}
        >
          <Camera className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : captures.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <ImageOff className="h-8 w-8" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>No visual feedback yet</p>
            <button
              onClick={onAddCapture}
              className="text-xs font-bold transition-colors"
              style={{ color: 'var(--brand)' }}
            >
              + Attach a screenshot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {captures.map(c => (
              <div
                key={c.id}
                className="group relative rounded-xl overflow-hidden border cursor-pointer transition-transform hover:scale-[1.02]"
                style={{ borderColor: 'var(--border-subtle)' }}
                onClick={() => setSelectedCapture(c)}
              >
                <img
                  src={mediaUrl(c.annotated_image || c.original_image)}
                  alt={c.title}
                  className="w-full h-28 object-cover"
                  style={{ background: '#111' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-xs font-bold text-white truncate">{c.title}</p>
                  <p className="text-[10px] text-gray-300">{c.created_by_name} · {timeAgo(c.created_at)}</p>
                </div>
                {c.annotated_image && (
                  <div className="absolute top-1.5 right-1.5 rounded px-1 py-0.5 text-[9px] font-bold text-white" style={{ background: 'var(--brand)' }}>
                    Annotated
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedCapture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setSelectedCapture(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCapture.title}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  by {selectedCapture.created_by_name} · {timeAgo(selectedCapture.created_at)}
                  {selectedCapture.page_url && (
                    <> · <a href={selectedCapture.page_url} target="_blank" rel="noreferrer" className="underline">{selectedCapture.page_url}</a></>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={mediaUrl(selectedCapture.annotated_image || selectedCapture.original_image)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </a>
                <button
                  onClick={() => setSelectedCapture(null)}
                  className="rounded-lg p-1.5 hover:bg-white/5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >✕</button>
              </div>
            </div>
            <div className="p-4" style={{ background: '#111' }}>
              <img
                src={mediaUrl(selectedCapture.annotated_image || selectedCapture.original_image)}
                alt={selectedCapture.title}
                className="max-h-[60vh] w-full object-contain mx-auto"
              />
            </div>
            {selectedCapture.description && (
              <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedCapture.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
