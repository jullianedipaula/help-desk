const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
  })

  if (res.status !== 401) {
    return res
  }

  // Attempt to refresh the access token
  const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!refreshRes.ok) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return res
  }

  // Retry the original request with the new access token
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
  })
}
