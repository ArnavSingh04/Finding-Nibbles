import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

function assertInRange(name: string, value: number, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ApiError(400, `${name} must be between ${min} and ${max}.`);
  }
}

/** POST /api/users/calorie-goal */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { calorieGoal } = await req.json();
    assertInRange("Calories", calorieGoal, 0, 10000);

    const users = await collections.users();
    await users.updateOne({ _id: userId }, { $set: { "profile.calorieGoal": calorieGoal } });
    return NextResponse.json({ ok: true });
  });
}
