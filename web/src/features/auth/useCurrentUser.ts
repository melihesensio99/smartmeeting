import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '../../lib/api'

export function useCurrentUser(enabled: boolean) {
  return useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser, enabled, retry: false, staleTime: 5 * 60 * 1000 })
}
