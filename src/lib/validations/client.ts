import { z } from "zod"

export const createClientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  industry: z.string().min(2, "Ingresá la industria"),
  description: z.string().min(20, "Describí el negocio con más detalle"),
  targetAudience: z.string().min(10, "Describí el público objetivo"),
  objectives: z.string().min(10, "Describí los objetivos"),
  communicationTone: z.string().min(2, "Indicá el tono de comunicación"),
  postFrequency: z.number().int().min(1).max(7),
  instagramHandle: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial().extend({
  instagramAccountId: z.string().optional(),
  instagramToken: z.string().optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
