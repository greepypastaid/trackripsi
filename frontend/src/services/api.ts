const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
const TOKEN_KEY = 'skripsi_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown }

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  const token = tokenStore.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers, body })
  } catch {
    throw new ApiError(0, 'Nggak bisa nyambung ke server. Cek koneksimu.')
  }

  if (response.status === 401) {
    tokenStore.clear()
    const publicPath = location.pathname.startsWith('/login') || location.pathname.startsWith('/auth/google/callback')
    if (!publicPath) location.assign('/login')
    throw new ApiError(401, 'Sesi kamu habis. Masuk lagi ya.')
  }

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? 'Servernya lagi bermasalah. Coba lagi sebentar.',
      payload?.errors ?? {},
    )
  }

  return payload as T
}
