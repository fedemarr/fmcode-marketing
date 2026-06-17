import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ContentStatus } from "@prisma/client"
import { publishPost } from "@/services/instagram/publish"
import { env } from "@/lib/env"

// Este endpoint es llamado por Vercel Cron cada hora
// Configurado en vercel.json
export async function GET(req: NextRequest) {
  // Verificar que viene de Vercel Cron
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  // Buscar posts APPROVED con scheduledAt en la última hora
  const postsToPublish = await db.post.findMany({
    where: {
      status: ContentStatus.APPROVED,
      scheduledAt: {
        gte: oneHourAgo,
        lte: now,
      },
      deletedAt: null,
    },
    select: { id: true, clientId: true },
  })

  const results = {
    attempted: postsToPublish.length,
    published: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const post of postsToPublish) {
    try {
      // Marcar como SCHEDULED primero para evitar doble publicación
      await db.post.update({
        where: { id: post.id },
        data: { status: ContentStatus.SCHEDULED },
      })

      await publishPost(post.id)
      results.published++
    } catch (error) {
      results.failed++
      results.errors.push(`Post ${post.id}: ${error instanceof Error ? error.message : "Error desconocido"}`)

      // Si falló, volver a APPROVED para que reintente en el próximo cron
      await db.post.update({
        where: { id: post.id },
        data: { status: ContentStatus.APPROVED },
      }).catch(() => null)
    }
  }

  console.log(`[CRON publish] ${JSON.stringify(results)}`)
  return Response.json(results)
}
