import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { apiSuccess, apiError } from "@/lib/errors"
import { createClientSchema } from "@/lib/validations/client"

export async function GET() {
  try {
    const clients = await db.client.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        industry: true,
        isActive: true,
        instagramHandle: true,
        postFrequency: true,
        createdAt: true,
        _count: { select: { posts: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: "desc" },
    })
    return apiSuccess(clients)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createClientSchema.parse(body)

    const client = await db.client.create({
      data: {
        ...data,
        postFrequency: data.postFrequency,
      },
    })

    return apiSuccess(client, 201)
  } catch (error) {
    return apiError(error)
  }
}
