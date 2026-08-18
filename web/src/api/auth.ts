const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'

// ── Token storage ─────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens(): void {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('userId') // legacy
  localStorage.removeItem('auth_user')
}

// ── Auth API calls ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  access: string
  refresh: string
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || err.non_field_errors?.[0] || 'Invalid credentials')
  }
  return res.json()
}

export async function register(data: {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  password_confirm: string
}): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    // Surface the first field error
    const firstKey = Object.keys(err)[0]
    const msg = Array.isArray(err[firstKey]) ? err[firstKey][0] : err[firstKey]
    throw new Error(`${firstKey}: ${msg}`)
  }
  return res.json()
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null
  try {
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) {
      clearTokens()
      return null
    }
    const data = await res.json()
    localStorage.setItem('access_token', data.access)
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh)
    return data.access
  } catch {
    clearTokens()
    return null
  }
}

export async function getMe(): Promise<Omit<AuthUser, 'access' | 'refresh'> | null> {
  let token = getAccessToken()
  if (!token) return null
  let res = await fetch(`${API_BASE}/auth/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    // Try to refresh
    token = await refreshAccessToken()
    if (!token) return null
    res = await fetch(`${API_BASE}/auth/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  }
  if (!res.ok) return null
  return res.json()
}

export async function logout(refresh?: string): Promise<void> {
  const token = getAccessToken()
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refresh: refresh || getRefreshToken() }),
      })
    } catch { /* ignore network errors on logout */ }
  }
  clearTokens()
}

export async function changePassword(data: {
  old_password: string
  new_password: string
  new_password_confirm: string
}): Promise<void> {
  const token = getAccessToken()
  const res = await fetch(`${API_BASE}/auth/change-password/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    const firstKey = Object.keys(err)[0]
    const msg = Array.isArray(err[firstKey]) ? err[firstKey][0] : err[firstKey]
    throw new Error(`${firstKey}: ${msg}`)
  }
}
