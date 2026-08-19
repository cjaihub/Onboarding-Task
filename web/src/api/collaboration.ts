import type { VisualCapture, Notification, CaptureAnnotation } from '../types/collaboration'

// Derive the collaboration base URL at call time (client-only).
// NEXT_PUBLIC_API_URL e.g. "http://127.0.0.1:8000/api" → base = "http://127.0.0.1:8000"
function collabBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
  const base = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl.replace(/\/api$/, '')
  return `${base}/api/collaboration`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const userId = localStorage.getItem('userId')
  return userId ? { 'X-User-ID': userId } : {}
}

// ── Visual Captures ──────────────────────────────────────────────────────────

export async function listCaptures(params?: { project?: number; work_item?: number }): Promise<VisualCapture[]> {
  if (typeof window === 'undefined') return []
  const qs = new URLSearchParams()
  if (params?.project) qs.set('project', String(params.project))
  if (params?.work_item) qs.set('work_item', String(params.work_item))
  const res = await fetch(`${collabBase()}/captures/?${qs}`, {
    headers: getUserHeader(),
  })
  if (!res.ok) throw new Error('Failed to list captures')
  const data = await res.json()
  return Array.isArray(data) ? data : data.results ?? []
}

export async function getCapture(id: number): Promise<VisualCapture> {
  const res = await fetch(`${collabBase()}/captures/${id}/`, { headers: getUserHeader() })
  if (!res.ok) throw new Error('Failed to get capture')
  return res.json()
}

export async function createCapture(data: {
  title: string
  description?: string
  project: number
  work_item?: number
  capture_type: 'VISIBLE' | 'SELECTED' | 'FULL_PAGE'
  image_base64?: string
  page_url?: string
  page_title?: string
  browser?: string
  viewport_width?: number
  viewport_height?: number
}): Promise<VisualCapture> {
  const res = await fetch(`${collabBase()}/captures/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserHeader() },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}

export async function uploadAnnotatedImage(
  captureId: number,
  annotatedDataUrl: string
): Promise<VisualCapture> {
  const response = await fetch(annotatedDataUrl)
  const blob = await response.blob()
  const form = new FormData()
  form.append('annotated_image', blob, `annotated_${captureId}.png`)

  const res = await fetch(`${collabBase()}/captures/${captureId}/`, {
    method: 'PATCH',
    headers: getUserHeader(),
    body: form,
  })
  if (!res.ok) throw new Error('Failed to upload annotated image')
  return res.json()
}

// ── Annotations ───────────────────────────────────────────────────────────────

export async function createAnnotation(data: Omit<CaptureAnnotation, 'id'>): Promise<CaptureAnnotation> {
  const res = await fetch(`${collabBase()}/annotations/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserHeader() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create annotation')
  return res.json()
}

export async function deleteAnnotation(id: number): Promise<void> {
  await fetch(`${collabBase()}/annotations/${id}/`, {
    method: 'DELETE',
    headers: getUserHeader(),
  })
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function listNotifications(recipientId: number): Promise<Notification[]> {
  // Guard: never run on the server
  if (typeof window === 'undefined') return []
  const res = await fetch(`${collabBase()}/notifications/?recipient=${recipientId}`, {
    headers: getUserHeader(),
  })
  if (!res.ok) throw new Error('Failed to list notifications')
  const data = await res.json()
  return Array.isArray(data) ? data : data.results ?? []
}

export async function markAllRead(): Promise<void> {
  if (typeof window === 'undefined') return
  await fetch(`${collabBase()}/notifications/mark_all_read/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getUserHeader() },
  })
}
