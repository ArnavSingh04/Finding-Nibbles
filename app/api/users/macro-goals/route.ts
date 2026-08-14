import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

function assertInRange(name: string, value: number, min: number, max: number) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ApiError(400, `${name} must be between ${min} and ${max}.`);
  }
}

/** POST /api/users/macro-goals */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { macroGoals } = await req.json();
    const { protein, fat, carbs } = macroGoals ?? {};

    assertInRange("Protein", protein, 0, 1000);
    assertInRange("Fat", fat, 0, 1000);
    assertInRange("Carbs", carbs, 0, 1000);

    const users = await collections.users();
    await users.updateOne(
      { _id: userId },
      { $set: { "profile.macroGoals": { protein, fat, carbs } } }
    );
    return NextResponse.json({ ok: true });
  });
}
