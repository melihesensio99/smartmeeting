import { useEffect, useState } from 'react'

export type AppRoute = 'dashboard' | 'meetings' | 'actions' | 'login' | 'register' | 'meeting-detail'

export function routeFromPath(path: string): AppRoute {
  if (path === '/login') return 'login'
  if (path === '/register') return 'register'
  if (path === '/meetings') return 'meetings'
  if (path.startsWith('/meetings/')) return 'meeting-detail'
  if (path === '/actions') return 'actions'
  return 'dashboard'
}

export function meetingIdFromPath(path: string): string | null {
  const value = path.match(/^\/meetings\/([^/]+)$/)?.[1]
  return value ?? null
}

export function navigate(path: string): void {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function useAppPath(): string {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  return path
}
