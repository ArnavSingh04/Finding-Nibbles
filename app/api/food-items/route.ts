import { NextRequest, NextResponse } from "next/server";
import { collections, randomId } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

/** POST /api/food-items - persist a food item (from foodMethods.foodItems.save). */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { _id, ...item } = await req.json();
    const _newId = randomId();
    const foodItems = await collections.foodItems();
    await foodItems.insertOne({
      _id: _newId,
      ...item,
      createdAt: new Date(),
      createdBy: userId || "system",
    });
    return NextResponse.json({ _id: _newId });
  });
}
