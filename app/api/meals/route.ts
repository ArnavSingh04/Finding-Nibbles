import { NextRequest, NextResponse } from "next/server";
import { collections, randomId } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/meals — all meals for the current user. */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const meals = await collections.meals();
    const items = await meals.find({ userId }).toArray();
    return NextResponse.json(items);
  });
}

/** POST /api/meals — log a meal. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const meal = await req.json();
    const _id = randomId();
    const meals = await collections.meals();
    await meals.insertOne({
      _id,
      userId,
      date: meal.date,
      meal: meal.meal,
      calories: meal.calories ?? null,
      protein: meal.protein ?? null,
      fat: meal.fat ?? null,
      carbs: meal.carbs ?? null,
    });
    return NextResponse.json({ _id });
  });
}
