import { z } from 'zod'

export const authResponseSchema = z.object({ expiresAt: z.string(), userId: z.string().min(1), displayName: z.string() })
export type AuthResponse = z.infer<typeof authResponseSchema>
