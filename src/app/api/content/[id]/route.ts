import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiSuccess, apiError, NotFoundError } from "@/lib/errors"
import { updatePostSchema } from "@/lib/validations/post"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await db.post.findUnique({
      where: { id: params.id, deletedAt: null },
      select: {
        id: true,
        clientId: true,
        platform: true,
        contentType: true,
        status: true,
        objective: true,
        hook: true,
        caption: true,
        cta: true,
        hashtags: true,
        imagePrompt: true,
        imageUrl: true,
        scheduledAt: true,
        publishedAt: true,
        approvalNotes: true,
        rejectionReason: true,
        createdAt: true,
        client: {
          select: { id: true, name: true, industry: true, communicationTone: true },
        },
        metrics: true,
      },
    })

    if (!post) throw new NotFoundError("Post")
    return apiSuccess(post)
  } catch (error) {
    return apiError(error)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await db.post.findUnique({ where: { id: params.id, deletedAt: null } })
    if (!post) throw new NotFoundError("Post")

    const body = await req.json()
    const data = updatePostSchema.parse(body)

    const updated = await db.post.update({
      where: { id: params.id },
      data: {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return apiError(error)
  }
}
