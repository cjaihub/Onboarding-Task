/**
 * Derive the backend base URL (no trailing slash, no /api).
 * Reads NEXT_PUBLIC_API_URL at runtime, falls back to localhost.
 */
export function backendBase(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'
  // Strip trailing /api suffix
  return apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl.replace(/\/api$/, '')
}

/**
 * Build a full URL for a backend media file path like "/media/captures/foo.png"
 */
export function mediaUrl(path: string): string {
  return `${backendBase()}${path}`
}
