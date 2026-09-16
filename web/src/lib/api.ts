import axios from 'axios'
import { meetingSchema, type CreateMeetingInput, type Meeting } from '../types/meeting'
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api' })
export async function getMeetings(): Promise<Meeting[]> { const response = await client.get<unknown>('/meetings'); if (!Array.isArray(response.data)) throw new Error('API toplantı listesi beklenen formatta değil.'); return response.data.map((item: unknown) => meetingSchema.parse(item)) }
export async function createMeeting(input: CreateMeetingInput): Promise<Meeting> { const response = await client.post<unknown>('/meetings', { ...input, endsAt: input.endsAt || null }); return meetingSchema.parse(response.data) }
