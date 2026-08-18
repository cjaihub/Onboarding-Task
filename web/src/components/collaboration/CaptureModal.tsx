"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { AnnotationEditor } from './AnnotationEditor'
import { createCapture, listCaptures, uploadAnnotatedImage } from '../../api/collaboration'
import { useAuth } from '../../contexts/AuthContext'
import type { VisualCapture } from '../../types/collaboration'
import { Camera, ExternalLink, Loader2, CheckCircle2, AlertCircle, X, Image, Plus, MonitorUp } from 'lucide-react'
import { createComment } from '../../api/comments'
import { mediaUrl } from '../../lib/backend-url'

interface CaptureModalProps {
  projectId: number
  workItemId?: number
  onClose: () => void
  onCaptureLinked?: (capture: VisualCapture) => void
}

type Step = 'method' | 'preview' | 'annotate' | 'uploading' | 'success'

export function CaptureModal({ projectId, workItemId, onClose, onCaptureLinked }: CaptureModalProps) {
  const { currentUser } = useAuth()
  const [step, setStep] = useState<Step>('method')
  const [existingCaptures, setExistingCaptures] = useState<VisualCapture[]>([])
  const [captureDataUrl, setCaptureDataUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [savedCapture, setSavedCapture] = useState<VisualCapture | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(false)

  useEffect(() => {
    if (workItemId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingExisting(true)
      listCaptures({ work_item: workItemId })
        .then(setExistingCaptures)
        .catch(console.error)
        .finally(() => setLoadingExisting(false))
    }
  }, [workItemId])

  const handlePasteOrUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      setCaptureDataUrl(e.target?.result as string)
      setStep('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handlePasteOrUpload(file)
  }, [handlePasteOrUpload])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePasteOrUpload(file)
  }

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
    if (item) {
      const file = item.getAsFile()
      if (file) handlePasteOrUpload(file)
    }
  }, [handlePasteOrUpload])

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  const handleCaptureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const dataUrl = canvas.toDataURL('image/png')
      setCaptureDataUrl(dataUrl)
      setStep('preview')

      stream.getTracks().forEach(t => t.stop())
    } catch (e) {
      console.error(e)
      setError('Failed to capture screen. Please ensure you granted permission.')
    }
  }

  const handleAnnotationSave = async (annotatedDataUrl: string) => {
    if (!captureDataUrl) return
    setStep('uploading')
    setError(null)

    try {
      // 1. Create the capture record with base64 original
      const capture = await createCapture({
        title: title || 'Untitled Capture',
        description,
        project: projectId,
        work_item: workItemId,
        capture_type: 'VISIBLE',
        image_base64: captureDataUrl,
        page_url: window.location.href,
        browser: navigator.userAgent.split(' ').pop(),
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      })

      // 2. Upload annotated version
      const updated = await uploadAnnotatedImage(capture.id, annotatedDataUrl)
      
      if (workItemId) {
        // Also post it as a comment so it shows up in the discussion thread
        const blob = await (await fetch(annotatedDataUrl)).blob()
        const file = new File([blob], `capture_${capture.id}.png`, { type: 'image/png' })
        await createComment(workItemId, title || 'Visual Feedback: Annotated Screenshot', file)
      }

      setSavedCapture(updated)
      setStep('success')
      onCaptureLinked?.(updated)
    } catch (e) {
      setError(String(e))
      setStep('preview')
    }
  }

  const handleSkipAnnotation = async () => {
    if (!captureDataUrl) return
    setStep('uploading')
    try {
      const capture = await createCapture({
        title: title || 'Untitled Capture',
        description,
        project: projectId,
        work_item: workItemId,
        capture_type: 'VISIBLE',
        image_base64: captureDataUrl,
        page_url: window.location.href,
        browser: navigator.userAgent.split(' ').pop(),
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      })
      
      if (workItemId) {
        // Also post it as a comment so it shows up in the discussion thread
        const blob = await (await fetch(captureDataUrl)).blob()
        const file = new File([blob], `capture_${capture.id}.png`, { type: 'image/png' })
        await createComment(workItemId, title || 'Visual Feedback: Screenshot', file)
      }

      setSavedCapture(capture)
      setStep('success')
      onCaptureLinked?.(capture)
    } catch (e) {
      setError(String(e))
      setStep('method')
    }
  }

  if (step === 'annotate' && captureDataUrl) {
    return (
      <AnnotationEditor
        imageUrl={captureDataUrl}
        onSave={handleAnnotationSave}
        onClose={() => setStep('preview')}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--brand)' }}>
              <Camera className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Visual Feedback</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Attach a screenshot or upload an image</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg p-3 text-sm" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#ef4444' }}>
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── step: method ── */}
          {step === 'method' && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-raised)' }}
              >
                <Image className="h-8 w-8" style={{ color: 'var(--text-muted)' }} />
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Drop image here or paste from clipboard</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PNG, JPG, WebP — or press Ctrl+V</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <label className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                    style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                    Browse File
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                  </label>
                  <div className="text-gray-500 text-sm font-bold">OR</div>
                  <button 
                    onClick={handleCaptureScreen}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors text-white shadow-sm"
                    style={{ background: 'var(--brand)' }}
                  >
                    <MonitorUp className="w-4 h-4" /> Live Capture
                  </button>
                </div>
              </div>

              {/* Existing captures */}
              {workItemId && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                    Attached to this Work Item
                  </h3>
                  {loadingExisting ? (
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                    </div>
                  ) : existingCaptures.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No captures yet.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {existingCaptures.map(c => (
                        <div key={c.id} className="relative group rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
                          <img
                            src={mediaUrl(c.annotated_image || c.original_image)}
                            alt={c.title}
                            className="w-full h-20 object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={mediaUrl(c.original_image)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded p-1 bg-white/20 hover:bg-white/40"
                            >
                              <ExternalLink className="h-3 w-3 text-white" />
                            </a>
                          </div>
                          <div className="px-1.5 py-1 text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{c.title}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── step: preview ── */}
          {step === 'preview' && captureDataUrl && (
            <>
              <img src={captureDataUrl} alt="Preview" className="w-full rounded-xl max-h-64 object-contain"
                style={{ background: '#111', border: '1px solid var(--border-subtle)' }} />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Login button misaligned on mobile"
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Describe the issue..."
                    className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('annotate')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white"
                  style={{ background: 'var(--brand)' }}
                >
                  <Camera className="h-4 w-4" />
                  Annotate & Save
                </button>
                <button
                  onClick={handleSkipAnnotation}
                  disabled={!title.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  Save as-is
                </button>
              </div>
            </>
          )}

          {/* ── step: uploading ── */}
          {step === 'uploading' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--brand)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Uploading capture...</p>
            </div>
          )}

          {/* ── step: success ── */}
          {step === 'success' && savedCapture && (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle2 className="h-10 w-10" style={{ color: '#22c55e' }} />
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Capture Saved!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>&quot;{savedCapture.title}&quot; has been attached.</p>
              </div>
              <img
                src={mediaUrl(savedCapture.annotated_image || savedCapture.original_image)}
                alt={savedCapture.title}
                className="w-full rounded-xl max-h-40 object-contain"
                style={{ background: '#111', border: '1px solid var(--border-subtle)' }}
              />
              <button
                onClick={onClose}
                className="rounded-xl px-6 py-2 text-sm font-bold text-white"
                style={{ background: 'var(--brand)' }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
