import axios from 'axios'
import { meetingSchema, type AddParticipantInput, type CreateMeetingInput, type Meeting } from '../types/meeting'
import { authResponseSchema, type AuthResponse } from '../types/auth'
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api', withCredentials: true })
export async function getMeetings(): Promise<Meeting[]> { const response = await client.get<unknown>('/meetings'); if (!Array.isArray(response.data)) throw new Error('API toplantı listesi beklenen formatta değil.'); return response.data.map((item: unknown) => meetingSchema.parse(item)) }
export async function createMeeting(input: CreateMeetingInput): Promise<Meeting> { const response = await client.post<unknown>('/meetings', { ...input, endsAt: input.endsAt || null }); return meetingSchema.parse(response.data) }

export async function uploadMeetingAudio(meetingId: string, audio: Blob, fileName = 'meeting.webm'): Promise<Meeting> {
  const formData = new FormData()
  formData.append('file', audio, fileName)
  const response = await client.post<unknown>(`/meetings/${meetingId}/audio`, formData)
  return meetingSchema.parse(response.data)
}

export async function completeActionItem(meetingId: string, actionItemId: string): Promise<Meeting> {
  const response = await client.post<unknown>(`/meetings/${meetingId}/action-items/${actionItemId}/complete`)
  return meetingSchema.parse(response.data)
}

export async function updateMeetingNotes(meetingId: string, notes: string): Promise<Meeting> {
  const response = await client.put<unknown>(`/meetings/${meetingId}/notes`, { notes })
  return meetingSchema.parse(response.data)
}

export async function mapSpeaker(meetingId: string, participantId: string, speakerLabel: string): Promise<Meeting> {
  const response = await client.put<unknown>(`/meetings/${meetingId}/participants/${participantId}/speaker`, { speakerLabel })
  return meetingSchema.parse(response.data)
}

export async function addParticipant(meetingId: string, input: AddParticipantInput): Promise<Meeting> {
  const response = await client.post<unknown>(`/meetings/${meetingId}/participants`, input)
  return meetingSchema.parse(response.data)
}

export async function sendSummaryEmail(meetingId: string): Promise<void> { await client.post(`/meetings/${meetingId}/summary/email`) }

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await client.post<unknown>('/auth/login', { email, password })
  return authResponseSchema.parse(response.data)
}

export async function logout(): Promise<void> { await client.post('/auth/logout') }
