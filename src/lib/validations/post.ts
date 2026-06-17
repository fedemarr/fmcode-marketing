import { z } from "zod"

export const updatePostSchema = z.object({
  hook: z.string().min(1).optional(),
  caption: z.string().min(1).optional(),
  cta: z.string().min(1).optional(),
  hashtags: z.array(z.string()).optional(),
  imagePrompt: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
})

export const rejectPostSchema = z.object({
  reason: z.string().min(1, "Indicá el motivo del rechazo"),
})

export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type RejectPostInput = z.infer<typeof rejectPostSchema>
