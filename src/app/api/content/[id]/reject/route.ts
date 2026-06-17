export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiSuccess, apiError, NotFoundError, AppError } from "@/lib/errors"
import { ContentStatus } from "@prisma/client"
import { rejectPostSchema } from "@/lib/validations/post"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await db.post.findUnique({ where: { id: params.id, deletedAt: null } })
    if (!post) throw new NotFoundError("Post")

    if (post.status === ContentStatus.PUBLISHED) {
      throw new AppError("No se puede rechazar un post ya publicado", 400, "INVALID_STATUS")
    }

    const body = await req.json()
    const { reason } = rejectPostSchema.parse(body)

    const updated = await db.post.update({
      where: { id: params.id },
      data: {
        status: ContentStatus.REJECTED,
        rejectionReason: reason,
      },
    })

    await db.calendarEntry.updateMany({
      where: { postId: params.id },
      data: { status: ContentStatus.REJECTED },
    })

    return apiSuccess(updated)
  } catch (error) {
    return apiError(error)
  }
}
