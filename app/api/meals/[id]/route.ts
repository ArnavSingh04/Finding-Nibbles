import { NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

/** DELETE /api/meals/[id] */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const meals = await collections.meals();
    const meal = await meals.findOne({ _id: params.id, userId });
    if (!meal) throw new ApiError(404, "Meal not found or not authorized");
    const result = await meals.deleteOne({ _id: params.id, userId });
    return NextResponse.json({ ok: result.deletedCount });
  });
}
