import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiSuccess, apiError, NotFoundError } from "@/lib/errors"
import { uploadImageFromUrl, uploadImageFromBase64 } from "@/services/storage/cloudinary"

const schema = z.union([
  z.object({ type: z.literal("url"), imageUrl: z.string().url() }),
  z.object({ type: z.literal("base64"), base64: z.string().min(1) }),
])

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await db.post.findUnique({
      where: { id: params.id, deletedAt: null },
      select: { id: true },
    })
    if (!post) throw new NotFoundError("Post")

    const body = await req.json()
    const input = schema.parse(body)

    const imageUrl =
      input.type === "url"
        ? await uploadImageFromUrl(input.imageUrl, params.id)
        : await uploadImageFromBase64(input.base64, params.id)

    await db.post.update({
      where: { id: params.id },
      data: { imageUrl },
    })

    return apiSuccess({ imageUrl })
  } catch (error) {
    return apiError(error)
  }
}
