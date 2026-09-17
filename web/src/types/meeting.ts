import { z } from 'zod'
export const actionPrioritySchema = z.enum(['Low', 'Medium', 'High']).or(z.enum(['low', 'medium', 'high']))
export const actionItemSchema = z.object({ id: z.string().uuid(), description: z.string(), assignee: z.string().nullable(), assigneeUserId: z.string().nullable(), dueAt: z.string().nullable(), priority: actionPrioritySchema, completed: z.boolean() })
export type ActionItem = z.infer<typeof actionItemSchema>
export type ActionPriority = z.infer<typeof actionPrioritySchema>
export const participantSchema = z.object({ id: z.string().uuid(), userId: z.string(), displayName: z.string(), email: z.string(), canManageMeeting: z.boolean(), speakerLabel: z.string().nullable(), speakerMappingStatus: z.enum(['None', 'PendingConfirmation', 'Confirmed']), speakerConfidence: z.number().nullable() })
export const meetingSchema = z.object({ id: z.string().uuid(), title: z.string(), organizerId: z.string(), startsAt: z.string(), endsAt: z.string().nullable(), status: z.union([z.number(), z.string()]), transcript: z.string().nullable(), notes: z.string().nullable(), participants: z.array(participantSchema), summary: z.object({ overview: z.string(), decisions: z.array(z.string()), actionItems: z.array(actionItemSchema) }).nullable() })
export type Meeting = z.infer<typeof meetingSchema>
export const createMeetingSchema = z.object({ title: z.string().min(3, 'Toplantı adı en az 3 karakter olmalıdır.').max(160), startsAt: z.string().min(1, 'Başlangıç zamanı zorunludur.'), endsAt: z.string().optional() })
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>
export const addParticipantSchema = z.object({ userId: z.string().min(1, 'Kullanıcı ID zorunludur.').max(100), displayName: z.string().min(2, 'Ad soyad zorunludur.').max(160), email: z.string().email('Geçerli bir e-posta giriniz.'), canManageMeeting: z.boolean().default(false) })
export type AddParticipantInput = z.infer<typeof addParticipantSchema>
export const userResponseSchema = z.object({ userId: z.string(), displayName: z.string(), email: z.string().email() })
export type UserResponse = z.infer<typeof userResponseSchema>
