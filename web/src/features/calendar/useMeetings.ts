import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMeeting, getMeetings, uploadMeetingAudio } from '../../lib/api'
import type { CreateMeetingInput } from '../../types/meeting'
export function useMeetings() { const queryClient = useQueryClient(); const meetings = useQuery({ queryKey: ['meetings'], queryFn: getMeetings }); const invalidate = () => queryClient.invalidateQueries({ queryKey: ['meetings'] }); const create = useMutation({ mutationFn: (input: CreateMeetingInput) => createMeeting(input), onSuccess: invalidate }); const upload = useMutation({ mutationFn: ({ meetingId, audio }: { meetingId: string; audio: Blob }) => uploadMeetingAudio(meetingId, audio), onSuccess: invalidate }); return { meetings, create, upload } }
