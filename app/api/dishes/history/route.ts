import { NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

/** DELETE /api/dishes/history — clear all of the user's swipe history. */
export async function DELETE() {
  return handle(async () => {
    const userId = await requireUserId();
    const dishSwipes = await collections.dishSwipes();
    const result = await dishSwipes.deleteMany({ userId });
    return NextResponse.json({ deletedCount: result.deletedCount ?? 0 });
  });
}
