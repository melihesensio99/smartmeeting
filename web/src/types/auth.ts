import { z } from 'zod'

export const authResponseSchema = z.object({ expiresAt: z.string(), userId: z.string().min(1), displayName: z.string() })
export type AuthResponse = z.infer<typeof authResponseSchema>

export const currentUserSchema = z.object({ userId: z.string().min(1), email: z.string().email(), displayName: z.string(), isGlobalManager: z.boolean() })
export type CurrentUser = z.infer<typeof currentUserSchema>
