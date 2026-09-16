import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMeeting, getMeetings } from '../../lib/api'
import type { CreateMeetingInput } from '../../types/meeting'
export function useMeetings() { const queryClient = useQueryClient(); const meetings = useQuery({ queryKey: ['meetings'], queryFn: getMeetings }); const create = useMutation({ mutationFn: (input: CreateMeetingInput) => createMeeting(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }) }); return { meetings, create } }
