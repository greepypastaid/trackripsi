import { tokenStore } from './api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

/** Authenticated binary download — the file route is protected, so a plain <a href> cannot be used. */
export async function apiRaw(path: string, fileName: string): Promise<void> {
  const token = tokenStore.get()
  const response = await fetch(`${BASE_URL}${path.replace(/^\/api\/v1/, '')}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('Berkasnya nggak bisa diunduh.')
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
