import { NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/dishes/preferences — distinct recently-liked dish names. */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const dishSwipes = await collections.dishSwipes();
    const likes = await dishSwipes
      .aggregate([
        { $match: { userId, liked: true } },
        { $group: { _id: "$name", lastLikedAt: { $max: "$createdAt" } } },
        { $sort: { lastLikedAt: -1 } },
        { $limit: 50 },
        { $project: { _id: 0, name: "$_id" } },
      ])
      .toArray();
    return NextResponse.json(likes.map((d: any) => d.name));
  });
}
