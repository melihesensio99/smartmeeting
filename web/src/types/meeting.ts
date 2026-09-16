import { z } from 'zod'
export const actionItemSchema = z.object({ id: z.string().uuid(), description: z.string(), assignee: z.string().nullable(), dueAt: z.string().nullable(), completed: z.boolean() })
export const participantSchema = z.object({ id: z.string().uuid(), userId: z.string(), displayName: z.string(), email: z.string(), speakerLabel: z.string().nullable() })
export const meetingSchema = z.object({ id: z.string().uuid(), title: z.string(), organizerId: z.string(), startsAt: z.string(), endsAt: z.string().nullable(), status: z.union([z.number(), z.string()]), transcript: z.string().nullable(), notes: z.string().nullable(), participants: z.array(participantSchema), summary: z.object({ overview: z.string(), decisions: z.array(z.string()), actionItems: z.array(actionItemSchema) }).nullable() })
export type Meeting = z.infer<typeof meetingSchema>
export const createMeetingSchema = z.object({ title: z.string().min(3, 'Toplantı adı en az 3 karakter olmalıdır.').max(160), organizerId: z.string().min(1, 'Organizatör zorunludur.'), startsAt: z.string().min(1, 'Başlangıç zamanı zorunludur.'), endsAt: z.string().optional() })
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>
