import { NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

/** DELETE /api/saved-dishes/[id] */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const savedDishes = await collections.savedDishes();
    const result = await savedDishes.deleteOne({ _id: params.id, userId });
    if (result.deletedCount === 0) throw new ApiError(404, "Dish not found");
    return NextResponse.json({ ok: result.deletedCount });
  });
}
