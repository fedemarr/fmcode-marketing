export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiSuccess, apiError, NotFoundError, AppError } from "@/lib/errors"
import { ContentStatus } from "@prisma/client"
import { createMediaContainer, publishMedia } from "@/services/instagram/client"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await db.post.findUnique({
      where: { id: params.id, deletedAt: null },
      include: { client: true },
    })
    if (!post) throw new NotFoundError("Post")

    const publishableStatuses: ContentStatus[] = [
      ContentStatus.DRAFT,
      ContentStatus.PENDING_APPROVAL,
      ContentStatus.APPROVED,
      ContentStatus.SCHEDULED,
    ]
    if (!publishableStatuses.includes(post.status)) {
      throw new AppError("Este post no se puede publicar (ya está publicado o fue rechazado)", 400, "INVALID_STATUS")
    }

    if (!post.imageUrl) {
      throw new AppError("El post no tiene imagen. Subí o generá una imagen primero.", 400, "NO_IMAGE")
    }

    if (!post.client.instagramAccountId || !post.client.instagramToken) {
      throw new AppError(
        "El cliente no tiene Instagram configurado. Agregá el Account ID y el Token en la página del cliente.",
        400,
        "NO_INSTAGRAM"
      )
    }

    // Move through states to SCHEDULED
    await db.post.update({
      where: { id: params.id },
      data: { status: ContentStatus.SCHEDULED },
    })

    const fullCaption = `${post.caption}\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}`

    const creationId = await createMediaContainer(
      post.client.instagramAccountId,
      post.client.instagramToken,
      post.imageUrl,
      fullCaption
    )

    await new Promise((resolve) => setTimeout(resolve, 2000))

    const instagramPostId = await publishMedia(
      post.client.instagramAccountId,
      post.client.instagramToken,
      creationId
    )

    await db.post.update({
      where: { id: params.id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        instagramPostId,
      },
    })

    await db.calendarEntry.updateMany({
      where: { postId: params.id },
      data: { status: ContentStatus.PUBLISHED },
    })

    return apiSuccess({ instagramPostId })
  } catch (error) {
    return apiError(error)
  }
}
