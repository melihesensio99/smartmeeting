import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '../../lib/api'

export function useCurrentUser(enabled: boolean) {
  const userId = localStorage.getItem('smartmeeting-user-id') ?? 'anonymous'
  return useQuery({ queryKey: ['current-user', userId], queryFn: getCurrentUser, enabled, retry: false, staleTime: 5 * 60 * 1000 })
}
