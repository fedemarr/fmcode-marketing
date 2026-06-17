export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiSuccess, apiError, NotFoundError, AppError } from "@/lib/errors"
import { publishPost } from "@/services/instagram/publish"
import { ContentStatus } from "@prisma/client"

const schema = z.object({ postId: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { postId } = schema.parse(body)

    const post = await db.post.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true, status: true },
    })
    if (!post) throw new NotFoundError("Post")
    if (post.status !== ContentStatus.APPROVED) {
      throw new AppError("Solo se pueden publicar posts en estado APPROVED", 400, "INVALID_STATUS")
    }

    await db.post.update({ where: { id: postId }, data: { status: ContentStatus.SCHEDULED } })
    const instagramPostId = await publishPost(postId)

    return apiSuccess({ instagramPostId })
  } catch (error) {
    return apiError(error)
  }
}
