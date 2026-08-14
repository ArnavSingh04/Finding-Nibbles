import { NextRequest, NextResponse } from "next/server";
import { collections, randomId } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

/** POST /api/dishes/swipe — record a like/dislike swipe. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { name, liked } = await req.json();
    const dishSwipes = await collections.dishSwipes();
    await dishSwipes.insertOne({
      _id: randomId(),
      userId,
      name,
      liked: Boolean(liked),
      createdAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  });
}
