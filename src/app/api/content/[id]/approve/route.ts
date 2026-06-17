import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { apiSuccess, apiError, NotFoundError, AppError } from "@/lib/errors"
import { ContentStatus } from "@prisma/client"

const schema = z.object({
  notes: z.string().optional(),
  scheduledAt: z.string().datetime().optional(), // override de la fecha si quiere cambiarla
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await db.post.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!post) throw new NotFoundError("Post")
    if (post.status !== ContentStatus.PENDING_APPROVAL && post.status !== ContentStatus.DRAFT) {
      throw new AppError("Solo se pueden aprobar posts en estado DRAFT o PENDING_APPROVAL", 400, "INVALID_STATUS")
    }

    const body = await req.json().catch(() => ({}))
    const { notes, scheduledAt } = schema.parse(body)

    const updated = await db.post.update({
      where: { id: params.id },
      data: {
        status: ContentStatus.APPROVED,
        approvalNotes: notes,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : post.scheduledAt,
      },
    })

    // Actualizar la entrada del calendario
    await db.calendarEntry.updateMany({
      where: { postId: params.id },
      data: { status: ContentStatus.APPROVED },
    })

    return apiSuccess(updated)
  } catch (error) {
    return apiError(error)
  }
}
