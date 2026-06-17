import type {
  Client,
  Post,
  CalendarEntry,
  ContentStrategy,
  PostMetrics,
  ContentStatus,
  ContentType,
  Platform,
} from "@prisma/client"

// Re-exports para no importar desde @prisma/client en toda la app
export type {
  Client,
  Post,
  CalendarEntry,
  ContentStrategy,
  PostMetrics,
  ContentStatus,
  ContentType,
  Platform,
}

// Post con relaciones comunes
export type PostWithClient = Post & {
  client: Client
  metrics: PostMetrics | null
}

// Entrada de calendario con post
export type CalendarEntryWithPost = CalendarEntry & {
  post: Post | null
  client: Client
}

// Respuesta estándar de la API
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

// Parámetros para generar el calendario
export interface GenerateCalendarParams {
  clientId: string
  month: number
  year: number
}
