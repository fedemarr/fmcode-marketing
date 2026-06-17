import { db } from "@/lib/db"
import { ContentStatus } from "@prisma/client"
import { createMediaContainer, publishMedia } from "./client"
import { AppError } from "@/lib/errors"

export async function publishPost(postId: string): Promise<string> {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: { client: true },
  })

  if (!post) throw new AppError("Post no encontrado", 404, "NOT_FOUND")
  if (post.status !== ContentStatus.SCHEDULED) {
    throw new AppError("El post no está en estado SCHEDULED", 400, "INVALID_STATUS")
  }
  if (!post.imageUrl) throw new AppError("El post no tiene imagen", 400, "NO_IMAGE")
  if (!post.client.instagramAccountId || !post.client.instagramToken) {
    throw new AppError("El cliente no tiene Instagram configurado", 400, "NO_INSTAGRAM")
  }

  // Armar el caption completo: caption + hashtags
  const fullCaption = `${post.caption}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`

  // Paso 1: Crear container en Instagram
  const creationId = await createMediaContainer(
    post.client.instagramAccountId,
    post.client.instagramToken,
    post.imageUrl,
    fullCaption
  )

  // Pequeño delay recomendado por Meta antes de publicar
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Paso 2: Publicar
  const instagramPostId = await publishMedia(
    post.client.instagramAccountId,
    post.client.instagramToken,
    creationId
  )

  // Actualizar el post en la DB
  await db.post.update({
    where: { id: postId },
    data: {
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      instagramPostId,
    },
  })

  // Actualizar la entrada del calendario
  await db.calendarEntry.updateMany({
    where: { postId },
    data: { status: ContentStatus.PUBLISHED },
  })

  return instagramPostId
}
