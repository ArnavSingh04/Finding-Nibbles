import { NextRequest, NextResponse } from "next/server";
import { collections, ensureIndexes } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

/** GET /api/saved-restaurants — user's saved restaurants, newest first. */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const savedRestaurants = await collections.savedRestaurants();
    const items = await savedRestaurants
      .find({ userId }, { sort: { createdAt: -1 } })
      .toArray();
    return NextResponse.json(items);
  });
}

/** POST /api/saved-restaurants — upsert a saved restaurant (unique per placeId). */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const restaurant = await req.json();

    const placeId = String(restaurant.placeId ?? "").trim();
    if (!placeId) throw new ApiError(400, "placeId is required");
    if (typeof restaurant.name !== "string" || typeof restaurant.location !== "string") {
      throw new ApiError(400, "name and location are required");
    }

    await ensureIndexes();
    const now = new Date();
    const savedRestaurants = await collections.savedRestaurants();
    try {
      const res = await savedRestaurants.updateOne(
        { userId, placeId },
        {
          $setOnInsert: { userId, placeId, createdAt: now },
          $set: {
            name: restaurant.name.trim(),
            location: restaurant.location.trim(),
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            rating: restaurant.rating ?? null,
            cuisine: restaurant.cuisine ?? [],
          },
        },
        { upsert: true }
      );
      const _id =
        (res.upsertedId as any) ??
        (await savedRestaurants.findOne({ userId, placeId }, { projection: { _id: 1 } }))?._id;
      return NextResponse.json({ _id });
    } catch (err: any) {
      if (err?.code === 11000) throw new ApiError(409, "You already saved this restaurant");
      throw err;
    }
  });
}

/** DELETE /api/saved-restaurants — remove a saved restaurant by placeId. */
export async function DELETE(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { placeId } = await req.json();
    if (typeof placeId !== "string") throw new ApiError(400, "placeId is required");

    const savedRestaurants = await collections.savedRestaurants();
    const result = await savedRestaurants.deleteOne({ userId, placeId: placeId.trim() });
    if (result.deletedCount === 0) throw new ApiError(404, "Restaurant not found");
    return NextResponse.json({ deletedCount: result.deletedCount });
  });
}
