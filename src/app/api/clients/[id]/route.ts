import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiSuccess, apiError, NotFoundError } from "@/lib/errors"
import { updateClientSchema } from "@/lib/validations/client"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await db.client.findUnique({
      where: { id: params.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        industry: true,
        description: true,
        targetAudience: true,
        objectives: true,
        communicationTone: true,
        postFrequency: true,
        instagramHandle: true,
        instagramAccountId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        strategies: {
          select: { id: true, month: true, year: true, analysis: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        posts: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            contentType: true,
            hook: true,
            scheduledAt: true,
            publishedAt: true,
            imageUrl: true,
          },
          orderBy: { scheduledAt: "asc" },
          take: 50,
        },
      },
    })

    if (!client) throw new NotFoundError("Cliente")
    return apiSuccess(client)
  } catch (error) {
    return apiError(error)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data = updateClientSchema.parse(body)

    const client = await db.client.findUnique({ where: { id: params.id, deletedAt: null } })
    if (!client) throw new NotFoundError("Cliente")

    const updated = await db.client.update({
      where: { id: params.id },
      data,
    })

    return apiSuccess(updated)
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await db.client.findUnique({ where: { id: params.id, deletedAt: null } })
    if (!client) throw new NotFoundError("Cliente")

    await db.client.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), isActive: false },
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    return apiError(error)
  }
}
