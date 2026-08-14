import { NextRequest, NextResponse } from "next/server";
import { collections, ensureIndexes, randomId } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/saved-dishes — user's saved dishes, newest first. */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const savedDishes = await collections.savedDishes();
    const items = await savedDishes.find({ userId }, { sort: { createdAt: -1 } }).toArray();
    return NextResponse.json(items);
  });
}

/** POST /api/saved-dishes — save a dish for a city (unique per user). */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { name, city } = await req.json();
    if (typeof name !== "string" || typeof city !== "string") {
      throw new ApiError(400, "name and city are required");
    }

    await ensureIndexes();
    const savedDishes = await collections.savedDishes();
    const existing = await savedDishes.findOne({ userId, name, city });
    if (existing) throw new ApiError(409, "You already saved this dish");

    const _id = randomId();
    try {
      await savedDishes.insertOne({ _id, userId, name, city, createdAt: new Date() });
    } catch (err: any) {
      if (err?.code === 11000) throw new ApiError(409, "You already saved this dish");
      throw err;
    }
    return NextResponse.json({ _id });
  });
}
